using Microsoft.AspNetCore.Mvc;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController
    {
        private readonly UsersService _usersService;

        public UsersController(UsersService usersService)
        {
            _usersService = usersService;
        }

        //[HttpGet("documents")]
        //public async Task<IActionResult> GetDocuments()
        //{
        //    var collection = _firestoreDb.Collection("users");
        //    var snapshot = await collection.GetSnapshotAsync();
        //    return Ok(snapshot.Documents.Select(doc => doc.Id));
        //}

    }
}
