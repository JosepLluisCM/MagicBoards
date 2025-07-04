using System.Net;

namespace server.Utilities
{
    public class BaseException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public BaseException(string message, HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
            : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class ItemNotFoundException : BaseException
    {
        public string ItemId { get; }
        public ItemNotFoundException(string id)
            : base($"Item not found", HttpStatusCode.NotFound)
        {
            ItemId = id;
        }
    }

    public class CanvasNotFoundException : BaseException
    {
        public string CanvasId { get; }
        public CanvasNotFoundException(string canvasId)
            : base($"Canvas not found", HttpStatusCode.NotFound)
        {
            CanvasId = canvasId;
        }
    }

    public class ImageNotFoundException : BaseException
    {
        public string ImagePath { get; }
        public ImageNotFoundException(string imagePath)
            : base($"Image not found", HttpStatusCode.NotFound)
        {
            ImagePath = imagePath;
        }
    }

    public class UserNotFoundException : BaseException
    {
        public string UserId { get; }
        public UserNotFoundException(string userId)
            : base($"User not found", HttpStatusCode.NotFound)
        {
            UserId = userId;
        }
    }

    public class UnauthorizedOperationException : BaseException
    {
        public string Operation { get; }
        public UnauthorizedOperationException(string operation)
            : base($"Unauthorized to perform this operation", HttpStatusCode.Forbidden)
        {
            Operation = operation;
        }
    }

    public class ValidationException : BaseException
    {
        public ValidationException(string message)
            : base(message, HttpStatusCode.BadRequest)
        {
        }
    }
}
