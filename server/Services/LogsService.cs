using Google.Cloud.Firestore;
using server.Models;

namespace server.Services
{
    public class LogsService
    {
        private readonly FirestoreDb _db;
        private readonly ILogger<LogsService> _logger;

        public LogsService(FirestoreService firestoreService, ILogger<LogsService> logger)
        {
            _db = firestoreService.GetFirestoreDb();
            _logger = logger;
        }

        public async Task LogErrorAsync(Exception exception, HttpContext httpContext, int statusCode)
        {
            try
            {
                var docRef = _db.Collection("logs").Document();

                var log = new Dictionary<string, object?>
                {
                    ["id"]            = docRef.Id,
                    ["level"]         = "error",
                    ["exceptionType"] = exception.GetType().FullName ?? exception.GetType().Name,
                    ["message"]       = exception.Message,
                    ["stackTrace"]    = exception.StackTrace,
                    ["httpMethod"]    = httpContext.Request.Method,
                    ["path"]          = httpContext.Request.Path.ToString(),
                    ["statusCode"]    = statusCode,
                    ["traceId"]       = httpContext.TraceIdentifier,
                    ["createdAt"]     = Timestamp.GetCurrentTimestamp(),
                };

                await docRef.SetAsync(log);
            }
            catch (Exception ex)
            {
                // Never let the logging path crash the response pipeline
                _logger.LogError(ex, "Failed to persist error log to Firestore");
            }
        }
    }
}
