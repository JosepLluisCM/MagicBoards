using Google.Cloud.Firestore;

namespace server.Models
{
    [FirestoreData]
    public class Log
    {
        [FirestoreProperty]
        public string Id { get; set; } = string.Empty;

        [FirestoreProperty]
        public string Level { get; set; } = string.Empty;       // "error" | "warn"

        [FirestoreProperty]
        public string ExceptionType { get; set; } = string.Empty;

        [FirestoreProperty]
        public string Message { get; set; } = string.Empty;

        [FirestoreProperty]
        public string? StackTrace { get; set; }

        [FirestoreProperty]
        public string HttpMethod { get; set; } = string.Empty;

        [FirestoreProperty]
        public string Path { get; set; } = string.Empty;

        [FirestoreProperty]
        public int StatusCode { get; set; }

        [FirestoreProperty]
        public string TraceId { get; set; } = string.Empty;

        [FirestoreProperty]
        public Timestamp CreatedAt { get; set; }
    }
}
