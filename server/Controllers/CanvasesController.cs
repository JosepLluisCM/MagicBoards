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
            try
            {
                string uid = GetUserIdOrUnauthorized();

                List<CanvasListItem> canvasList = await _canvasesService.GetCanvasesForUserAsync(uid);
                return Ok(canvasList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateCanvas([FromBody] CreateCanvasRequest request)
        {
            try
            {
                string uid = GetUserIdOrUnauthorized();

                Canvas newCanvas = await _canvasesService.CreateCanvasAsync(request, uid);
                return Ok(newCanvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
            
        }

        [HttpDelete("{canvasId}")]
        public async Task<IActionResult> DeleteCanvas(string canvasId)
        {
            try
            {
                string uid = GetUserIdOrUnauthorized();

                await _canvasesService.DeleteCanvasAsync(canvasId, uid);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
            
        }

        [HttpGet("{canvasId}")]
        public async Task<IActionResult> GetCanvas(string canvasId)
        {
            try
            {
                string uid = GetUserIdOrUnauthorized();

                Canvas canvas = await _canvasesService.GetCanvasAsync(canvasId, uid);
                return Ok(canvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
        }

        [HttpPut("{canvasId}")]
        public async Task<IActionResult> UpdateCanvas(string canvasId, [FromBody] UpdateCanvasRequest request)
        {
            try
            {
                string uid = GetUserIdOrUnauthorized();

                Canvas updatedCanvas = await _canvasesService.UpdateCanvasAsync(canvasId, request, uid);
                return Ok(updatedCanvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
        }
    }
}
