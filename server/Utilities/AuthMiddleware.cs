using server.Services;

namespace server.Utilities
{
    public class SessionAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly UsersService _usersService;

        public SessionAuthMiddleware(RequestDelegate next, UsersService usersService)
        {
            _next = next;
            _usersService = usersService;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip auth for login endpoint and other public routes
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
                try
                {
                    // Just check if cookie is valid - we don't need the user object here
                    bool cookieOk = await _usersService.CheckCookieAsync(sessionCookie);
                    if (cookieOk)
                    {
                        await _next(context);
                        return;
                    }
                }
                catch
                {
                    // Invalid cookie
                }
            }

            // Unauthorized
            context.Response.StatusCode = 401;
        }
    }

    // Extension method to make it easier to add the middleware
    public static class SessionAuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseSessionAuth(
            this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SessionAuthMiddleware>();
        }
    }
}