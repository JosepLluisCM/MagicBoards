using Google.Cloud.Firestore;

namespace server.Models
{
    [FirestoreData]
    public class CanvasListItem
    {
        [FirestoreProperty]
        public required string Id { get; set; }

        [FirestoreProperty]
        public required string Name { get; set; }

        [FirestoreProperty]
        public required string UserId { get; set; }

        [FirestoreProperty]
        public required DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public required DateTime UpdatedAt { get; set; }
    }
}

