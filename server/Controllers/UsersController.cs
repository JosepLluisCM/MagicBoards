using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Models.Requests;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : CustomBaseController
    {
        private readonly UsersService _usersService;
        private readonly int SessionDurationDays = 14; // Default session duration

        public UsersController(UsersService usersService)
        {
            _usersService = usersService;
        }

        [HttpPost("session")]
        public async Task<IActionResult> CreateSessionForUser([FromBody] LoginRequest request)
        {
            //WE add the IP to the User
            request.Ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            User user = await _usersService.GetOrCreateUserAsync(request);
            string sessionCookie = await _usersService.CreateSessionCookieAsync(request.IdToken, SessionDurationDays);
            Response.Cookies.Append(
                "__session", // Firebase convention
                sessionCookie,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Path = "/",
                    //DEBUG
                    //Expires = DateTime.UtcNow.AddMinutes(10),
                    Expires = DateTime.UtcNow.AddDays(SessionDurationDays),
                }
            );
            var graceUntil = DateTimeOffset.UtcNow.AddSeconds(5);
            Response.Cookies.Append("grace_until", graceUntil.ToUnixTimeSeconds().ToString(), new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Path = "/",
                SameSite = SameSiteMode.Lax,
                MaxAge = TimeSpan.FromSeconds(10), // <- short TTL,
            });
            return Ok(new
            {
                User = user
                //Session = userSession
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetUserFromCookie()
        {
            var sessionCookie = Request.Cookies["__session"];
            if (string.IsNullOrEmpty(sessionCookie)) throw new UnauthorizedAccessException("Unauthorised Acces");
            var user = await _usersService.GetUserFromCookieAsync(sessionCookie);
            if (user == null) return StatusCode(401, "Invalid or expired cookie");
            else return Ok(user);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> RevokeSessionForUser()
        {
            var sessionCookie = Request.Cookies["__session"];
            if (string.IsNullOrEmpty(sessionCookie)) throw new UnauthorizedAccessException("Unauthorised Acces");
            await _usersService.RevokeSessionForUserAsync(sessionCookie);
            Response.Cookies.Delete("__session", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/",
                //DEBUG
                //Expires = DateTime.UtcNow.AddMinutes(10),
                Expires = DateTime.UtcNow.AddDays(SessionDurationDays),
            });
            return Ok(new { message = "Logged Out Succesfully" });
        }
    }
}
