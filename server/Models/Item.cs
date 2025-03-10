using Google.Cloud.Firestore;

namespace server.Models
{
    [FirestoreData]
    public class Item
    {
        [FirestoreProperty]
        public string Id { get; set; }
        [FirestoreProperty]
        public string Description { get; set; } = string.Empty;
        [FirestoreProperty]
        public bool Checked { get; set; } = false;
    }
}