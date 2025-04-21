using Amazon.S3;
using Amazon.S3.Model;
using server.Models;
using server.Models.Requests;
using server.Utilities;
using System.Text;

namespace server.Services
{
    public class ImagesService
    {
        private readonly R2CloudflareService _r2CloudflareService;
        private readonly FirestoreService _firestoreService;
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public ImagesService(R2CloudflareService r2CloudflareService, FirestoreService firestoreService)
        {
            _r2CloudflareService = r2CloudflareService;
            _firestoreService = firestoreService;
            _s3Client = _r2CloudflareService.GetR2Client();
            _bucketName = _r2CloudflareService.GetR2BucketName();
        }

        public async Task<string> UploadImageAsync(string canvasId, IFormFile imageFile, string uid)
        {
            bool isOwner = await _firestoreService.IsOwnerAsync(canvasId, uid, "canvases");

            if (!isOwner) throw new UnauthorizedAccessException("You do not have permission to upload this image.");

            // Generate a unique file name or path
            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            string filePath = $"{uid}/{canvasId}/{fileName}";

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

        public async Task<(Stream ImageStream, string ContentType)> GetImageAsync(string imagePath, string uid)
        {
            try
            {
                //WE CHECK THE CANVASID AND USERID FROM THE PATH, AND CHECK OWNERSHIP
                string[] parts = imagePath.Split('/');
                string pathUserId = parts[0];
                string pathCanvasId = parts[1];

                bool isOwner = await _firestoreService.IsOwnerAsync(pathCanvasId, uid, "canvases");

                if (pathUserId != uid || !isOwner)
                {
                    throw new UnauthorizedAccessException("You do not have permission to view this image.");
                }

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

        public async Task<string> GetImagePresignedUrl(string imagePath, string uid)
        {
            try
            {
                //WE CHECK THE CANVASID AND USERID FROM THE PATH, AND CHECK OWNERSHIP
                string[] parts = imagePath.Split('/');
                string pathUserId = parts[0];
                string pathCanvasId = parts[1];

                bool isOwner = await _firestoreService.IsOwnerAsync(pathCanvasId, uid, "canvases");

                if (pathUserId != uid || !isOwner)
                {
                    throw new UnauthorizedAccessException("You do not have permission to view this image.");
                }

                // Create a request to get the object from R2
                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = imagePath,
                    Expires = DateTime.UtcNow.AddMinutes(15)
                };

                // Get the object from R2
                string response = await _s3Client.GetPreSignedURLAsync(request);

                // Return the stream and content type
                return response;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to retrieve imageURL: {ex.Message}", ex);
            }
        }

        public async Task DeleteImageAsync(string imagePath, string uid)
        {
            //WE CHECK THE CANVASID AND USERID FROM THE PATH, AND CHECK OWNERSHIP
            string[] parts = imagePath.Split('/');
            string pathUserId = parts[0];
            string pathCanvasId = parts[1];

            bool isOwner = await _firestoreService.IsOwnerAsync(pathCanvasId, uid, "canvases");

            if (pathUserId != uid || !isOwner)
            {
                throw new UnauthorizedAccessException("You do not have permission to delete this Image.");
            }

            DeleteObjectRequest deleteObjectRequest = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = imagePath
            };

            await _s3Client.DeleteObjectAsync(deleteObjectRequest);
        }

        public async Task DeleteAllCanvasImagesAsync(string uid, string canvasId)
        {
            string prefix = $"{uid}/{canvasId}/";

            var listResponse = await _s3Client.ListObjectsV2Async(new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix
            });
            
            if (listResponse.S3Objects.Count == 0)
                return; // Nothing to delete
                
            var deleteRequest = new DeleteObjectsRequest
            {
                BucketName = _bucketName,
                Objects = listResponse.S3Objects.Select(obj => new KeyVersion { Key = obj.Key }).ToList()
            };
            
            await _s3Client.DeleteObjectsAsync(deleteRequest);
        }
    }
}
