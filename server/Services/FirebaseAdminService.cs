using FirebaseAdmin.Auth;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

namespace server.Services
{
    public class FirebaseAdminService
    {
        private readonly FirebaseApp _firebaseApp;

        public FirebaseAdminService()
        {
            if (FirebaseApp.DefaultInstance == null)
            {
                var credentialPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");

                _firebaseApp = FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile(credentialPath)
                });
            }
            else
            {
                _firebaseApp = FirebaseApp.DefaultInstance;
            }
        }

        public FirebaseApp GetFirebaseApp() => _firebaseApp;

        public async Task<string?> CheckCookieAsync(string sessionCookie, bool checkRevoked = false)
        {
            try
            {
                var decoded = await FirebaseAuth.DefaultInstance
                    .VerifySessionCookieAsync(sessionCookie, checkRevoked);

                return decoded.Uid;
            }
            catch
            {
                return null;
            }
        }
    }

}
