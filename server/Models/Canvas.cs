using Google.Cloud.Firestore;
using System;
using System.Collections.Generic;

namespace server.Models
{

    public enum ShapeType
    {
        Text,
        Image
    }

    [FirestoreData]
    public class Canvas
    {
        [FirestoreProperty]
        public required string Id { get; set; }

        [FirestoreProperty]
        public required string UserId { get; set; }

        [FirestoreProperty]
        public required string Name { get; set; }

        [FirestoreProperty]
        public required DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public required DateTime UpdatedAt { get; set; }

        [FirestoreProperty]
        public required Position Position { get; set; }

        [FirestoreProperty]
        public int Scale { get; set; }

        [FirestoreProperty]
        public List<CanvasElement> Elements { get; set; } = new List<CanvasElement>();

        //CONSTRUCTOR
        public static Canvas CreateNew(string Id, string userId, string name = "Untitled Canvas")
        {
            return new Canvas
            {
                Id = Id,
                UserId = userId,
                Name = name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Position = new Position { X = 0, Y = 0 },
                Scale = 100
            };
        }
    }

    [FirestoreData]
    public class CanvasElement
    {
        [FirestoreProperty]
        public string Type { get; set; }

        // Text-specific properties
        [FirestoreProperty]
        public string Content { get; set; }

        // Image-specific properties
        [FirestoreProperty]
        public string ImageId { get; set; }

        [FirestoreProperty]
        public Position Position { get; set; }

        [FirestoreProperty]
        public Size Size { get; set; }

        [FirestoreProperty]
        public ElementStyle Style { get; set; }
    }

    [FirestoreData]
    public class Position
    {
        [FirestoreProperty]
        public int X { get; set; }

        [FirestoreProperty]
        public int Y { get; set; }
    }

    [FirestoreData]
    public class Size
    {
        [FirestoreProperty]
        public int Width { get; set; }

        [FirestoreProperty]
        public int Height { get; set; }
    }

    [FirestoreData]
    public class ElementStyle
    {
        [FirestoreProperty]
        public string FillColor { get; set; }

        [FirestoreProperty]
        public string BorderColor { get; set; }

        [FirestoreProperty]
        public int FontSize { get; set; }

        [FirestoreProperty]
        public string Color { get; set; }
    }
}

