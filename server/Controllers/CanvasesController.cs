using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Models.Requests;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/canvases")]
    public class CanvasesController : CustomBaseController
    {
        private readonly CanvasesService _canvasesService;
        private readonly ImagesService _imagesService;

        public CanvasesController(CanvasesService canvasesService, ImagesService imagesService)
        {
            _canvasesService = canvasesService;
            _imagesService = imagesService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCanvasesForUser([FromQuery] int limit = 50)
        {
            string uid = GetUserIdOrUnauthorized();
            List<CanvasListItem> canvasList = await _canvasesService.GetCanvasesForUserAsync(uid, limit);
            return Ok(canvasList);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCanvas([FromBody] CreateCanvasRequest request)
        {
            string uid = GetUserIdOrUnauthorized();

            Canvas newCanvas = await _canvasesService.CreateCanvasAsync(request, uid);
            return Ok(newCanvas);

        }

        [HttpDelete("{canvasId}")]
        public async Task<IActionResult> DeleteCanvas(string canvasId)
        {
            string uid = GetUserIdOrUnauthorized();
            await _canvasesService.DeleteCanvasAsync(canvasId, uid);
            return Ok();
        }

        [HttpGet("{canvasId}")]
        public async Task<IActionResult> GetCanvas(string canvasId)
        {
            string uid = GetUserIdOrUnauthorized();
            Canvas canvas = await _canvasesService.GetCanvasAsync(canvasId, uid);
            return Ok(canvas);
        }

        [HttpPut("{canvasId}")]
        public async Task<IActionResult> UpdateCanvas(string canvasId, [FromBody] UpdateCanvasRequest request)
        {
            string uid = GetUserIdOrUnauthorized();
            Canvas updatedCanvas = await _canvasesService.UpdateCanvasAsync(canvasId, request, uid);
            return Ok(updatedCanvas);
        }

        [HttpPost("{canvasId}/preview")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 5 * 1024 * 1024)]
        public async Task<IActionResult> UploadPreview(string canvasId, IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No preview image provided");

            string ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            string mime = (image.ContentType ?? "").ToLowerInvariant();
            if (mime != "image/png" || ext != ".png")
                return BadRequest("Preview must be a PNG.");

            string uid = GetUserIdOrUnauthorized();
            string imagePath = await _imagesService.UploadPreviewAsync(canvasId, image, uid);
            return Ok(new { imagePath });
        }
    }
}
