using Google.Cloud.Firestore;
using server.Models;

namespace server.Services
{
    public class CanvasesService
    {
        private readonly FirestoreService _firestoreService;
        private readonly FirestoreDb _firestoreDb;

        public CanvasesService(FirestoreService firestoreService)
        {
            _firestoreService = firestoreService;
            _firestoreDb = _firestoreService.GetFirestoreDb();
        }

        public async Task<List<Canvas>> GetCanvasesAsync()
        {
            CollectionReference canvasesRef = _firestoreDb.Collection("canvases");
            QuerySnapshot snapshot = await canvasesRef.GetSnapshotAsync();

            List<Canvas> result = snapshot.Documents.Select(doc => doc.ConvertTo<Canvas>()).ToList();

            return result;

        }

        public async Task<Canvas> CreateCanvasAsync(string? name)
        {
            DocumentReference addedDocRef = _firestoreDb.Collection("canvases").Document();

            Canvas newCanvas = Canvas.CreateNew(addedDocRef.Id, "ADMIN", name ?? "Untitled Canvas");

            await addedDocRef.SetAsync(newCanvas);

            return newCanvas;

        }

        public async Task DeleteCanvasAsync(string id)
        {
            DocumentReference deletedDocRef = _firestoreDb.Collection("canvases").Document(id);

            await deletedDocRef.DeleteAsync();
        }
    }
}
