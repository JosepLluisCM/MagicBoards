using FirebaseAdmin.Auth;
using Google.Cloud.Firestore;
using server.Models;
using server.Models.Requests;
using server.Utilities;

namespace server.Services
{
    public class UsersService
    {
        private readonly FirestoreService _firestoreService;
        private readonly FirebaseAdminService _firebaseAdminService;
        private readonly FirestoreDb _firestoreDb;
        private readonly ILogger<UsersService> _logger;

        public UsersService(FirestoreService firestoreService, FirebaseAdminService firebaseAdminService, ILogger<UsersService> logger)
        {
            _firebaseAdminService = firebaseAdminService;
            _firestoreService = firestoreService;
            _firestoreDb = _firestoreService.GetFirestoreDb();
            _logger = logger;
        }

        public async Task<User> GetOrCreateUserAsync(LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.IdToken))
            {
                throw new ValidationException("ID token is required");
            }

            FirebaseToken decodedToken;
            try
            {
                decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.IdToken);
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogWarning("Login failed — invalid ID token for claimed uid={Uid}: {Reason}", request.Id, ex.Message);
                throw new ValidationException("Invalid ID token");
            }

            string uid = decodedToken.Uid;

            if (uid != request.Id)
            {
                _logger.LogWarning("Login failed — token uid={TokenUid} does not match claimed uid={ClaimedUid}", uid, request.Id);
                throw new ValidationException("ID token does not match the provided user ID");
            }

            // Check if user exists in Firestore
            DocumentReference userRef = _firestoreDb.Collection("users").Document(uid);
            DocumentSnapshot snapshot = await userRef.GetSnapshotAsync();

            if (snapshot.Exists)
            {
                User existingUser = snapshot.ConvertTo<User>();
                User updatedUser = User.Update(existingUser, request.Email, request.Name, request.AvatarUrl, request.UserAgent, request.Ip);
                await userRef.SetAsync(updatedUser);
                _logger.LogInformation("Login: existing user {Uid} authenticated from {Ip}", uid, request.Ip);
                return updatedUser;
            }
            else
            {
                User newUser = User.CreateNew(uid, request.Email, request.Name, request.AvatarUrl, request.UserAgent, request.Ip);
                await userRef.SetAsync(newUser);
                _logger.LogInformation("Login: new user {Uid} created from {Ip}", uid, request.Ip);
                return newUser;
            }
        }

        public async Task<string> CreateSessionCookieAsync(string idToken, int duration)
        {
            if (string.IsNullOrEmpty(idToken))
            {
                throw new ValidationException("ID token is required");
            }
            
            // Create the session cookie using Firebase Admin SDK
            string sessionCookie = await FirebaseAuth.DefaultInstance.CreateSessionCookieAsync(
                idToken, 
                new SessionCookieOptions
                {
                    //DEBUG
                    //ExpiresIn = TimeSpan.FromMinutes(10)
                    ExpiresIn = TimeSpan.FromDays(duration)
                }
            );

            return sessionCookie;
        }


        public async Task<User?> GetUserFromCookieAsync(string sessionCookie)
        {
            if (string.IsNullOrEmpty(sessionCookie))
            {
                throw new ValidationException("Session cookie is required");
            }

            try
            {
                // Verify the session cookie
                string? uid = await _firebaseAdminService.CheckCookieAsync(sessionCookie, true);

                if (string.IsNullOrEmpty(uid)) throw new UnauthorizedOperationException("access user data");

                // Retrieve user data from Firestore using the same pattern as other methods
                DocumentReference userRef = _firestoreDb.Collection("users").Document(uid);
                DocumentSnapshot snapshot = await userRef.GetSnapshotAsync();
        
                if (snapshot.Exists )
                {
                    return snapshot.ConvertTo<User>();
                }
        
                throw new UserNotFoundException(uid);
            }
            catch (FirebaseAuthException)
            {
                // Invalid or expired session cookie
                return null;
            }
        }

        public async Task RevokeSessionForUserAsync(string sessionCookie)
        {
            if (string.IsNullOrEmpty(sessionCookie))
            {
                throw new ValidationException("Session cookie is required");
            }
            try
            {
                // Verify the session cookie
                string? uid = await _firebaseAdminService.CheckCookieAsync(sessionCookie, false);

                if (string.IsNullOrEmpty(uid)) throw new UnauthorizedOperationException("revoke session");

                await FirebaseAuth.DefaultInstance.RevokeRefreshTokensAsync(uid);
                _logger.LogInformation("Logout: session revoked for user {Uid}", uid);
                await Task.Delay(2000);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Logout: failed to revoke session — {Reason}", ex.Message);
            }
        }

    }
}
