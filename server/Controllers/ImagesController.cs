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

        private static readonly string[] AllowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage([FromForm] string canvasId, IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No image file provided");

            string ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!AllowedMimeTypes.Contains(image.ContentType.ToLowerInvariant()) || !AllowedExtensions.Contains(ext))
                return BadRequest("File type not allowed. Accepted: JPEG, PNG, WebP, GIF.");

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
