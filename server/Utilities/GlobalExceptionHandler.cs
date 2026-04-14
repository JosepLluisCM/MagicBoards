using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using server.Services;
using server.Utilities;

namespace Server.Urilities
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly LogsService _logsService;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, LogsService logsService)
        {
            _logger = logger;
            _logsService = logsService;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            var problemDetails = new ProblemDetails();
            problemDetails.Instance = httpContext.Request.Path;

            if (exception is BaseException e)
            {
                httpContext.Response.StatusCode = (int)e.StatusCode;
                problemDetails.Title = e.Message;
            }
            else
            {
                problemDetails.Title = "An unexpected error occurred";
            }

            _logger.LogError(exception, "An error occurred: {ProblemDetailsTitle}", problemDetails.Title);

            problemDetails.Status = httpContext.Response.StatusCode;
            problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

            // Persist to Firestore (fire-and-forget — errors are swallowed inside LogErrorAsync)
            _ = _logsService.LogErrorAsync(exception, httpContext, httpContext.Response.StatusCode);

            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken).ConfigureAwait(false);
            return true;
        }
    }
}
