using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Models.Requests;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
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
            try
            {
                //WE add the IP to the User
                request.Ip = HttpContext.Connection.RemoteIpAddress?.ToString();

                User user = await _usersService.GetOrCreateUserAsync(request);

                string sessionCookie = await _usersService.CreateSessionCookieAsync(request.IdToken, SessionDurationDays);

                //UserSession userSession = await _usersService.CreateUserSessionAsync(request, user, SessionDurationDays);

                Response.Cookies.Append(
                    "__session", // Firebase convention
                    sessionCookie,
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.None,
                        //DEBUG
                        //Expires = DateTime.UtcNow.AddMinutes(10),
                        Expires = DateTime.UtcNow.AddDays(SessionDurationDays),
                    }
                );

                return Ok(new
                {
                    User = user
                    //Session = userSession
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            };
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetUserFromCookie()
        {
            try
            {
                var sessionCookie = Request.Cookies["__session"];
                if (string.IsNullOrEmpty(sessionCookie))
                    return StatusCode(401, "Session cookie missing");

                var user = await _usersService.GetUserFromCookieAsync(sessionCookie);

                if (user == null) return StatusCode(401, "Invalid or expired cookie");

                else return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            };
        }

        [HttpPost("logout")]
        public async Task<IActionResult> RevokeSessionForUser()
        {
            try
            {
                var sessionCookie = Request.Cookies["__session"];
                if (string.IsNullOrEmpty(sessionCookie))
                    return StatusCode(401, "Session cookie missing");

                await _usersService.RevokeSessionForUserAsync(sessionCookie);

                Response.Cookies.Delete("__session");

                return Ok(new { message = "Logged Out Succesfully" });

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            };
        }
    }
}
