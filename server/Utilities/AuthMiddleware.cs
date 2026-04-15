using server.Services;

namespace server.Utilities
{
    public class SessionAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly FirebaseAdminService _firebaseAdminService;
        private readonly ILogger<SessionAuthMiddleware> _logger;

        public SessionAuthMiddleware(RequestDelegate next, FirebaseAdminService firebaseAdminService, ILogger<SessionAuthMiddleware> logger)
        {
            _next = next;
            _firebaseAdminService = firebaseAdminService;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip auth for login/logout/me/swagger endpoints
            if (context.Request.Path.StartsWithSegments("/api/users/session") ||
                context.Request.Path.StartsWithSegments("/api/users/me") ||
                context.Request.Path.StartsWithSegments("/api/users/logout") ||
                context.Request.Path.StartsWithSegments("/swagger"))
            {
                await _next(context);
                return;
            }

            // Check for session cookie
            if (context.Request.Cookies.TryGetValue("__session", out string? sessionCookie))
            {
                bool checkRevoked = true;

                // Check for grace_until cookie
                if (context.Request.Cookies.TryGetValue("grace_until", out string? graceStr) &&
                    long.TryParse(graceStr, out var graceUnix))
                {
                    var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    if (nowUnix < graceUnix)
                    {
                        checkRevoked = false;
                    }
                }

                string? userUid = null;
                try
                {
                    userUid = await _firebaseAdminService.CheckCookieAsync(sessionCookie, checkRevoked);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Session validation failed for {Path}: {Message}", context.Request.Path, ex.Message);
                }

                if (userUid != null)
                {
                    context.Items["uid"] = userUid;

                    // Optional: clear grace_until cookie after first success
                    if (!checkRevoked)
                    {
                        context.Response.Cookies.Append("grace_until", "", new CookieOptions
                        {
                            Expires = DateTimeOffset.UnixEpoch,
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict
                        });
                    }

                    await _next(context); // Let exceptions here bubble up to the global handler
                    return;
                }
            }

            // Unauthorized
            context.Response.StatusCode = 401;
            return;
        }
    }

    public static class SessionAuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseSessionAuth(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SessionAuthMiddleware>();
        }
    }
}