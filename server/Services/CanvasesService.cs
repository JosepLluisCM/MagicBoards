using Google.Cloud.Firestore;
using server.Models;
using server.Models.Requests;

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

        public async Task<List<CanvasListItem>> GetCanvasesForUserAsync()
        {
            CollectionReference canvasesRef = _firestoreDb.Collection("canvases");
            QuerySnapshot snapshot = await canvasesRef.GetSnapshotAsync();

            List<CanvasListItem> result = snapshot.Documents.Select(doc => new CanvasListItem
            {
                Id = doc.Id,
                Name = doc.GetValue<string>("Name"),
                UserId = doc.GetValue<string>("UserId"),
                CreatedAt = doc.GetValue<DateTime>("CreatedAt"),
                UpdatedAt = doc.GetValue<DateTime>("UpdatedAt")
            }).ToList();

            return result;
        }

        public async Task<Canvas> CreateCanvasAsync(CreateCanvasRequest request)
        {
            DocumentReference addedDocRef = _firestoreDb.Collection("canvases").Document();

            Canvas newCanvas = Canvas.CreateNew(addedDocRef.Id, "ADMIN", request.Name ?? "Untitled Canvas");

            await addedDocRef.SetAsync(newCanvas);

            return newCanvas;
        }

        public async Task DeleteCanvasAsync(string id)
        {
            DocumentReference deletedDocRef = _firestoreDb.Collection("canvases").Document(id);

            await deletedDocRef.DeleteAsync();
        }

        public async Task<Canvas> GetCanvasAsync(string? id)
        {
            DocumentReference canvasRef = _firestoreDb.Collection("canvases").Document(id);
            DocumentSnapshot snapshot = await canvasRef.GetSnapshotAsync();

            if (!snapshot.Exists)
            {
                throw new Exception("Canvas not found");
            }

            return snapshot.ConvertTo<Canvas>();
        }

        public async Task<Canvas> UpdateCanvasAsync(string id, Canvas canvas)
        {
            DocumentReference canvasRef = _firestoreDb.Collection("canvases").Document(canvas.Id);
            DocumentSnapshot snapshot = await canvasRef.GetSnapshotAsync();

            if (!snapshot.Exists)
            {
                throw new Exception("Canvas not found");
            }

            // Update timestamp before saving
            canvas.UpdatedAt = DateTime.UtcNow;
            
            await canvasRef.SetAsync(canvas);
            return canvas;
        }
    }
}
