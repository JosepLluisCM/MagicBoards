using Google.Cloud.Firestore;

namespace server.Models
{

    public enum CanvasElementType
    {
        Image,
        Text
    }

    [FirestoreData]
    public class Canvas
    {
        [FirestoreProperty]
        public required string Id { get; set; }

        [FirestoreProperty]
        public required string Name { get; set; }

        [FirestoreProperty]
        public required CanvasData Data { get; set; }

        [FirestoreProperty]
        public required List<CanvasElement> Elements { get; set; }

        [FirestoreProperty]
        public required string UserId { get; set; }

        [FirestoreProperty]
        public required DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public required DateTime UpdatedAt { get; set; }

        //CONSTRUCTOR
        public static Canvas CreateNew(string Id, string userId, string name = "Untitled Canvas")
        {
            return new Canvas
            {
                Id = Id,
                Name = name,
                Data = new CanvasData
                {
                    Position = new CanvasPosition { X = 0, Y = 0 },
                    Scale = 1
                },
                Elements = new List<CanvasElement>(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public static Canvas Update(Canvas originalCanvas, CanvasData canvasData, List<CanvasElement> elements)
        {
            return new Canvas
            {
                Id = originalCanvas.Id,
                Name = originalCanvas.Name,
                Data = canvasData,
                Elements = elements,
                UserId = originalCanvas.UserId,
                CreatedAt = originalCanvas.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }

    [FirestoreData]
    public class CanvasData
    {
        [FirestoreProperty]
        public required CanvasPosition Position { get; set; }
        [FirestoreProperty]
        public required float Scale { get; set; }
    }

    [FirestoreData]
    public class CanvasPosition
    {
        [FirestoreProperty]
        public required float X { get; set; }
        [FirestoreProperty]
        public required float Y { get; set; }
    }

    [FirestoreData]
    public class CanvasElement
    {
        //COMMON
        [FirestoreProperty]
        public required string Id { get; set; }
        
        [FirestoreProperty]
        public required CanvasElementType Type { get; set; }

        [FirestoreProperty]
        public required CanvasElementData Data { get; set; }

        [FirestoreProperty]
        public required string Content { get; set; }

        [FirestoreProperty]
        public required string ImageId { get; set; }
    }

    [FirestoreData]
    public class CanvasElementData
    {
        [FirestoreProperty]
        public required CanvasElementPosition Position { get; set; }

        [FirestoreProperty]
        public required CanvasElementSize Size { get; set; }

        [FirestoreProperty]
        public required float Rotation { get; set; }
    }

    [FirestoreData]
    public class CanvasElementPosition
    {
        [FirestoreProperty]
        public required float X { get; set; }

        [FirestoreProperty]
        public required float Y { get; set; }

        [FirestoreProperty]
        public required int ZIndex { get; set; }
    }

    [FirestoreData]
    public class CanvasElementSize
    {
        [FirestoreProperty]
        public required float Width { get; set; }

        [FirestoreProperty]
        public required float Height { get; set; }
    }
}

