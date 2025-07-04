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

        public UsersService(FirestoreService firestoreService, FirebaseAdminService firebaseAdminService)
        {
            _firebaseAdminService = firebaseAdminService;
            _firestoreService = firestoreService;
            _firestoreDb = _firestoreService.GetFirestoreDb();
        }

        public async Task<User> GetOrCreateUserAsync(LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.IdToken))
            {
                throw new ValidationException("ID token is required");
            }

            // Seems that this is not necessary as all the info comes from the client correctly
            //var decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(request.IdToken);
            //string uid = decodedToken.Uid;

            // Check if user exists in Firestore
            DocumentReference userRef = _firestoreDb.Collection("users").Document(request.Id);
            DocumentSnapshot snapshot = await userRef.GetSnapshotAsync();

            if (snapshot.Exists)
            {

                User existingUser = snapshot.ConvertTo<User>();

                User updatedUser = User.Update(existingUser, request.Email, request.Name, request.AvatarUrl, request.UserAgent, request.Ip);

                await userRef.SetAsync(updatedUser);

                return updatedUser;
            }
            else
            {
                User newUser = User.CreateNew(request.Id, request.Email, request.Name, request.AvatarUrl, request.UserAgent, request.Ip);

                await userRef.SetAsync(newUser);

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

        //store session in db atm paused
        //public async Task<UserSession> CreateUserSessionAsync(LoginRequest request, User user, int duration)
        //{
        //    DocumentReference addedDocRef = _firestoreDb.Collection("sessions").Document();

        //    // Create a new session record
        //    UserSession userSession = UserSession.CreateNew(
        //        user.Uid,
        //        addedDocRef.Id, // Generate a session ID
        //        DateTime.UtcNow,
        //        DateTime.UtcNow.AddDays(duration),
        //        request.Ip, 
        //        request.UserAgent
        //    );

        //    await addedDocRef.SetAsync(userSession);

        //    return userSession;
        //}

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
                await Task.Delay(2000);
            }
            catch
            {
                // Token might already be invalid, continue silently
            }
        }

        //public async Task<string?> CheckCookieAsync(string sessionCookie)
        //{
        //    if (string.IsNullOrEmpty(sessionCookie))
        //    {
        //        throw new ArgumentException("Session cookie is required");
        //    }

        //    try
        //    {
        //        var decodedToken = await FirebaseAuth.DefaultInstance
        //            .VerifySessionCookieAsync(sessionCookie, checkRevoked: true);

        //        return decodedToken.Uid;
        //    }
        //    catch (FirebaseAuthException)
        //    {
        //        // Invalid or expired session cookie
        //        return null;
        //    }
        //}
    }
}
