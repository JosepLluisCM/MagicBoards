using Google.Cloud.Firestore;
using server.Models;
using server.Models.Requests;
using server.Utilities;

namespace server.Services
{
    public class CanvasesService
    {
        private readonly FirestoreService _firestoreService;
        private readonly FirestoreDb _firestoreDb;
        private readonly ImagesService _imagesService;

        public CanvasesService(FirestoreService firestoreService, ImagesService imagesService)
        {
            _firestoreService = firestoreService;
            _firestoreDb = _firestoreService.GetFirestoreDb();
            _imagesService = imagesService;
        }

        public async Task<List<CanvasListItem>> GetCanvasesForUserAsync(string uid)
        {
            CollectionReference canvasesRef = _firestoreDb.Collection("canvases");

            Query userCanvases = canvasesRef.WhereEqualTo("UserId", uid);

            QuerySnapshot snapshot = await userCanvases.GetSnapshotAsync();

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

        public async Task<Canvas> CreateCanvasAsync(CreateCanvasRequest request, string uid)
        {
            DocumentReference addedDocRef = _firestoreDb.Collection("canvases").Document();

            Canvas newCanvas = Canvas.CreateNew(addedDocRef.Id, uid, request.Name ?? "Untitled Canvas");

            await addedDocRef.SetAsync(newCanvas);

            //throw new ItemNotFoundException(addedDocRef.Id);

            return newCanvas;
        }

        public async Task DeleteCanvasAsync(string canvasId, string uid)
        {
            // First get the canvas to retrieve the userId
            DocumentReference canvasRef = _firestoreDb.Collection("canvases").Document(canvasId);
            DocumentSnapshot snapshot = await canvasRef.GetSnapshotAsync();
            
            if (!snapshot.Exists)
            {
                throw new CanvasNotFoundException(canvasId);
            }
            
            var canvas = snapshot.ConvertTo<Canvas>();

            string canvasUserId = canvas.UserId;

            if (canvas.UserId != uid)
            {
                throw new UnauthorizedOperationException("delete this canvas");
            }

            // Delete all images associated with this canvas
            await _imagesService.DeleteAllCanvasImagesAsync(canvasUserId, canvasId);
            await canvasRef.DeleteAsync();
        }

        public async Task<Canvas> GetCanvasAsync(string canvasId, string uid)
        {
            DocumentReference canvasRef = _firestoreDb.Collection("canvases").Document(canvasId);
            DocumentSnapshot snapshot = await canvasRef.GetSnapshotAsync();

            if (!snapshot.Exists)
            {
                throw new CanvasNotFoundException(canvasId);
            }

            var canvas = snapshot.ConvertTo<Canvas>();

            if (canvas.UserId != uid)
            {
                throw new UnauthorizedOperationException("view this canvas");
            }

            return canvas;
        }

        public async Task<Canvas> UpdateCanvasAsync(string canvasId, UpdateCanvasRequest request, string uid)
        {
            DocumentReference canvasRef = _firestoreDb.Collection("canvases").Document(canvasId);
            DocumentSnapshot snapshot = await canvasRef.GetSnapshotAsync();

            if (!snapshot.Exists)
            {
                throw new CanvasNotFoundException(canvasId);
            }

            var canvas = snapshot.ConvertTo<Canvas>();

            if (canvas.UserId != uid)
            {
                throw new UnauthorizedOperationException("update this canvas");
            }

            Canvas updatedCanvas = Canvas.Update(canvas, request.Data, request.Elements);
            
            await canvasRef.SetAsync(updatedCanvas);
            return updatedCanvas;
        }
    }
}
