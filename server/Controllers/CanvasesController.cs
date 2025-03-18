using Microsoft.AspNetCore.Mvc;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CanvasesController
    {
        private readonly CanvasesService _canvasesService;

        public CanvasesController(CanvasesService canvasesService)
        {
            _canvasesService = canvasesService;
        }

        //[HttpGet("documents")]
        //public async Task<IActionResult> GetDocuments()
        //{
        //    var collection = _firestoreDb.Collection("Canvases");
        //    var snapshot = await collection.GetSnapshotAsync();
        //    return Ok(snapshot.Documents.Select(doc => doc.Id));
        //}

    }
}
