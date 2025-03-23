using Amazon.S3;
using Amazon.S3.Model;
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

        public async Task<string> UploadImageAsync(string id, IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new ArgumentException("No image file provided");

            // Generate a unique file name or path
            string fileName = $"{id}_{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            string filePath = $"{id}/{fileName}";

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
    }
}
