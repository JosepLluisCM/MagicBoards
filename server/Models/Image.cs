using Google.Cloud.Firestore;

namespace server.Models
{

    public enum ImageType
    {
        Uploaded,
        Generated
    }

    [FirestoreData]
    public class Image
    {
        [FirestoreProperty]
        public string Id { get; set; }

        [FirestoreProperty]
        public string CanvasId { get; set; }

        [FirestoreProperty]
        public string ImageUrl { get; set; }

        [FirestoreProperty]
        public string Type { get; set; }

        [FirestoreProperty]
        public DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public DateTime UpdatedAt { get; set; }

        [FirestoreProperty]
        public string CreatedBy { get; set; } // UserId

        [FirestoreProperty]
        public string UpdatedBy { get; set; } // UserId

        [FirestoreProperty]
        public Metadata Metadata { get; set; }
    }

    [FirestoreData]
    public class Metadata
    {
        [FirestoreProperty]
        public Size Size { get; set; }

        [FirestoreProperty]
        public string Format { get; set; }

        [FirestoreProperty]
        public string Prompt { get; set; }

        [FirestoreProperty]
        public string Model { get; set; }

        [FirestoreProperty]
        public Parameters Parameters { get; set; }

    }

    [FirestoreData]
    public class Parameters
    {
        [FirestoreProperty]
        public string Seed { get; set; }

        [FirestoreProperty]
        public string Steps { get; set; }

        [FirestoreProperty]
        public string Style { get; set; }
    }
}