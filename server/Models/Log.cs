using Google.Cloud.Firestore;

namespace server.Models
{
    [FirestoreData]
    public class Log
    {
        [FirestoreProperty]
        public string Id { get; set; }

        [FirestoreProperty]
        public string UserId { get; set; }

        [FirestoreProperty]
        public string CanvasId { get; set; }

        [FirestoreProperty]
        public DateTime Timestamp { get; set; }

        [FirestoreProperty]
        public string Action { get; set; }

        [FirestoreProperty]
        public string Message { get; set; } 

        [FirestoreProperty]
        public string Details { get; set; }

        [FirestoreProperty]
        public string Status { get; set; }

        [FirestoreProperty]
        public string Error { get; set; }
    }
}