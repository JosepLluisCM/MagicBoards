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

        public CanvasesController(CanvasesService canvasesService)
        {
            _canvasesService = canvasesService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCanvasesForUser()
        {
            string uid = GetUserIdOrUnauthorized();
            List<CanvasListItem> canvasList = await _canvasesService.GetCanvasesForUserAsync(uid);
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
    }
}
