using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;
using server.Models.Requests;
using server.Services;
using server.Utilities;

namespace server.Controllers
{
    [Route("api/images")]
    [ApiController]
    public class ImagesController : CustomBaseController
    {
        private readonly ImagesService _imagesService;

        public ImagesController(ImagesService imagesService)
        {
            _imagesService = imagesService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] string canvasId, IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No image file provided");
            string uid = GetUserIdOrUnauthorized();
            string imagePath = await _imagesService.UploadImageAsync(canvasId, image, uid);
            return Ok(new { imagePath = imagePath });
        }

        [HttpGet("{*imagePath}")]
        public async Task<IActionResult> GetImage(string imagePath)
        {
            string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);
            string uid = GetUserIdOrUnauthorized();
            var (imageStream, contentType) = await _imagesService.GetImageAsync(formattedPath, uid);
            Response.Headers.Append("Cache-Control", "public, max-age=86400"); // Cache for 1 day
            return File(imageStream, contentType);
        }

        [Obsolete("This endpoint is temporarily disabled but preserved for future use")]
        [HttpGet("presigned/{*imagePath}")]
        public async Task<IActionResult> GetImagePresignedUrl(string imagePath)
        {
            string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);
            string uid = GetUserIdOrUnauthorized();
            string presignedUrl = await _imagesService.GetImagePresignedUrl(formattedPath, uid);
            return Ok(new { url = presignedUrl });
        }

        [HttpDelete("{*imagePath}")]
        public async Task<IActionResult> DeleteImage(string imagePath)
        {
            string formattedPath = System.Net.WebUtility.UrlDecode(imagePath);
            string uid = GetUserIdOrUnauthorized();
            await _imagesService.DeleteImageAsync(formattedPath, uid);
            return Ok(new { 
                message = "Image deleted successfully", 
                imagePath = formattedPath 
            });
        }
    }
}
