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
        public async Task<FirebaseToken> VerifySessionCookieAsync(string sessionCookie)
        {
            return await FirebaseAuth.DefaultInstance.VerifySessionCookieAsync(sessionCookie);
        }
    }

}
