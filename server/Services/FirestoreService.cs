using Google.Cloud.Firestore;

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
  }


}
