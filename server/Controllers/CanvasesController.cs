using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Models.Requests;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/canvases")]
    public class CanvasesController : ControllerBase
    {
        private readonly CanvasesService _canvasesService;

        public CanvasesController(CanvasesService canvasesService)
        {
            _canvasesService = canvasesService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCanvases()
        {
            try
            {
                List<Canvas> canvasList = await _canvasesService.GetCanvasesAsync();
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
                Canvas newCanvas = await _canvasesService.CreateCanvasAsync(request.Name);
                return Ok(newCanvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
            
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCanvas(string id)
        {
            try
            {
                await _canvasesService.DeleteCanvasAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
            
        }
    }
}
