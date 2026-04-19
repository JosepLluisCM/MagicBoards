using Google.Cloud.Firestore;

namespace server.Models
{
    /// <summary>
    /// Firestore record written when an image is uploaded to R2.
    /// Used to detect and clean up orphaned images (uploaded but never saved into a canvas).
    /// Collection: "images". Document ID: auto-generated.
    /// </summary>
    [FirestoreData]
    public class ImageRecord
    {
        [FirestoreDocumentId]
        public string Id { get; set; } = string.Empty;

        [FirestoreProperty]
        public required string ImagePath { get; set; }

        [FirestoreProperty]
        public required string CanvasId { get; set; }

        [FirestoreProperty]
        public required string Uid { get; set; }

        [FirestoreProperty]
        public required DateTime UploadedAt { get; set; }
    }
}
