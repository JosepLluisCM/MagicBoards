using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;
using server.Models.Requests;
using server.Services;
using server.Utilities;

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
        public async Task<IActionResult> UploadImage([FromForm] AddImageRequest request, IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                    return BadRequest("No image file provided");
                
                // Call the service method to upload the image
                string imagePath = await _imagesService.UploadImageAsync(request, image);

                return Ok(new { imagePath = imagePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{*imagePath}")]
        public async Task<IActionResult> GetImage(string imagePath)
        {
            try
            { 
                string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);

                var (imageStream, contentType) = await _imagesService.GetImageAsync(formattedPath);

                Response.Headers.Append("Cache-Control", "public, max-age=86400"); // Cache for 1 day

                return File(imageStream, contentType);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error retrieving image {imagePath}: {ex.Message}");
                return NotFound($"Image not found: {imagePath}");
            }
        }

        [HttpGet("presigned/{*imagePath}")]
        public async Task<IActionResult> GetImagePresignedUrl(string imagePath)
        {
            try
            {
                string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);

                string presignedUrl = await _imagesService.GetImagePresignedUrl(formattedPath);

                return Ok(new { url = presignedUrl });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error retrieving image {imagePath}: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{*imagePath}")]
        public async Task<IActionResult> DeleteImage(string imagePath)
        {
            try
            {
                string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);
                await _imagesService.DeleteImageAsync(formattedPath);

                return Ok(new { 
                    message = "Image deleted successfully", 
                    imagePath = formattedPath 
        });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
