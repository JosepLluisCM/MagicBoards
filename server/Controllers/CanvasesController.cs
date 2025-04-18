﻿using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> GetCanvasesForUser()
        {
            try
            {
                List<CanvasListItem> canvasList = await _canvasesService.GetCanvasesForUserAsync();
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
                Canvas newCanvas = await _canvasesService.CreateCanvasAsync(request);
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
                await _canvasesService.DeleteCanvasAsync(canvasId);
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
                Canvas canvas = await _canvasesService.GetCanvasAsync(canvasId);
                return Ok(canvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
        }

        [HttpPut("{canvasId}")]
        public async Task<IActionResult> UpdateCanvas(string canvasId, [FromBody] Canvas canvas)
        {
            try
            {
                Canvas updatedCanvas = await _canvasesService.UpdateCanvasAsync(canvasId, canvas);
                return Ok(updatedCanvas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex}");
            }
        }
    }
}
