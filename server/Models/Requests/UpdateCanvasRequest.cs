using Google.Cloud.Firestore;

namespace server.Models.Requests
{
    [FirestoreData]
    public class UpdateCanvasRequest
    {
        //[FirestoreProperty]
        //public required string Name { get; set; }

        [FirestoreProperty]
        public required CanvasData Data { get; set; }

        [FirestoreProperty]
        public required List<CanvasElement> Elements { get; set; }
    }
}