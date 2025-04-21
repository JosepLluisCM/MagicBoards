using Google.Cloud.Firestore;
using server.Models;

namespace server.Services
{
    public class FirestoreService
    {
        private readonly FirestoreDb _firestoreDb;

        public FirestoreService()
        {
            var projectId = Environment.GetEnvironmentVariable("FIRESTORE_PROJECT_ID");
            if (string.IsNullOrEmpty(projectId))
            {
                throw new InvalidOperationException("Firestore Project ID not set in environment variables.");
            }

            _firestoreDb = FirestoreDb.Create(projectId);
            // Optional: Set up Firestore emulator for development
            // FirestoreDbBuilder dbBuilder = new FirestoreDbBuilder { ProjectId = projectId, EmulatorDetection = EmulatorDetection.EmulatorOrProduction };
            // _firestoreDb = dbBuilder.Build();
        }

        public FirestoreDb GetFirestoreDb() => _firestoreDb;

        //ATM ONLY FOR CANVASES
        public async Task<bool> IsOwnerAsync(string? documentId, string uid, string collectionName)
        {
            if (string.IsNullOrEmpty(documentId)) return false;
            var docRef = _firestoreDb.Collection("canvases").Document(documentId);
            var snapshot = await docRef.GetSnapshotAsync();

            if (!snapshot.Exists) return false; // NOT FOUND

            var data = snapshot.ConvertTo<Canvas>();

            return data.UserId == uid;
        }
    }
}
