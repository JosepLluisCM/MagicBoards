using Microsoft.AspNetCore.Mvc;

namespace server.Controllers
{
    public abstract class CustomBaseController : ControllerBase
    {
        protected string GetUserIdOrUnauthorized()
        {
            string? uid = HttpContext.Items["uid"] as string;
            if (string.IsNullOrEmpty(uid))
                throw new UnauthorizedAccessException("User is not authenticated.");
            return uid;
        }
    }
}
