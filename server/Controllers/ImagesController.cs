using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.Services;
using System;
using System.Threading.Tasks;

namespace server.Controllers
{
    [Route("api/images")]
    [ApiController]
    public class ImagesController : ControllerBase
    {
        private readonly ImagesService _imagesService;

        public ImagesController(ImagesService imagesService)
        {
            _imagesService = imagesService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest("No image file provided");
                
                // Call the service method to upload the image
                string imagePath = await _imagesService.UploadImageAsync("ADMIN", image);
                
                // Return the path or a full URL to the image
                return Ok(new { imagePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
