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
        public required string Id { get; set; }

        [FirestoreProperty]
        public required ImageType Type { get; set; }

        [FirestoreProperty]
        public required string ImageUrl { get; set; }

        [FirestoreProperty]
        public required string CanvasId { get; set; }

        [FirestoreProperty]
        public required string UserId { get; set; }

        [FirestoreProperty]
        public required DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public required DateTime UpdatedAt { get; set; }

        [FirestoreProperty]
        public ImageMetadata? Metadata { get; set; }

        public static Image CreateNew(string id, string userId, string canvasId, ImageType type, string imageUrl)
        {
            return new Image
            {
                Id = id,
                Type = type,
                ImageUrl = imageUrl,
                CanvasId = canvasId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Metadata = null
            };
        }
    }

    [FirestoreData]
    public class ImageMetadata
    {
        [FirestoreProperty]
        public string? Format { get; set; }
        [FirestoreProperty]
        public string? OriginalSize { get; set; }
    }


}