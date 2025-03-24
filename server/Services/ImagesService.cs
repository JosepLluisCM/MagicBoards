using Amazon.S3;
using Amazon.S3.Model;
using server.Models.Requests;
using server.Utilities;
using System.Text;

namespace server.Services
{
    public class ImagesService
    {
        private readonly R2CloudflareService _r2CloudflareService;
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public ImagesService(R2CloudflareService r2CloudflareService)
        {
            _r2CloudflareService = r2CloudflareService;
            _s3Client = _r2CloudflareService.GetR2Client();
            _bucketName = _r2CloudflareService.GetR2BucketName();
        }

        public async Task<string> UploadImageAsync(AddImageRequest request, IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new ArgumentException("No image file provided");

            // Generate a unique file name or path
            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            string filePath = $"{request.UserId}/{request.CanvasId}/{fileName}";

            // Create a memory stream to hold the file data
            using (var memoryStream = new MemoryStream())
            {
                // Copy the file data to memory stream
                await imageFile.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                // Create the request to upload to R2
                PutObjectRequest addImageRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = filePath,
                    InputStream = memoryStream,
                    ContentType = imageFile.ContentType,
                    DisablePayloadSigning = true
                };

                // Execute the upload
                await _s3Client.PutObjectAsync(addImageRequest);

                // Return the path or URL to the uploaded image
                return filePath;
            }
        }

        public async Task<(Stream ImageStream, string ContentType)> GetImageAsync(string imagePath)
        {
            try
            {
                // Create a request to get the object from R2
                var request = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = imagePath
                    //DisablePayloadSigning = true
                };

                // Get the object from R2
                var response = await _s3Client.GetObjectAsync(request);

                // Determine the content type based on the file extension
                string contentType = Utils.GetContentTypeFromPath(imagePath);

                // Return the stream and content type
                return (response.ResponseStream, contentType);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to retrieve image: {ex.Message}", ex);
            }
        }
    }
}
