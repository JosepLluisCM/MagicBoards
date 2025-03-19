using Microsoft.AspNetCore.Mvc;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/images")]
    public class ImagesController
    {
        private readonly ImagesService _imagesService;

        public ImagesController(ImagesService imagesService)
        {
            _imagesService = imagesService;
        }

        //[HttpGet("documents")]
        //public async Task<IActionResult> GetDocuments()
        //{
        //    var collection = _firestoreDb.Collection("Images");
        //    var snapshot = await collection.GetSnapshotAsync();
        //    return Ok(snapshot.Documents.Select(doc => doc.Id));
        //}

    }
}
