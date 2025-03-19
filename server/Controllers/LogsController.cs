using Microsoft.AspNetCore.Mvc;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/logs")]
    public class LogsController
    {
        private readonly LogsService _logsService;

        public LogsController(LogsService logsService)
        {
            _logsService = logsService;
        }

        //[HttpGet("documents")]
        //public async Task<IActionResult> GetDocuments()
        //{
        //    var collection = _firestoreDb.Collection("Logs");
        //    var snapshot = await collection.GetSnapshotAsync();
        //    return Ok(snapshot.Documents.Select(doc => doc.Id));
        //}

    }
}
