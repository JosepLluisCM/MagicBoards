using Amazon.S3;
using Amazon.S3.Model;
using Google.Cloud.Firestore;
using server.Models;
using server.Utilities;

namespace server.Services
{
    public class ImagesService
    {
        private readonly R2CloudflareService _r2CloudflareService;
        private readonly FirestoreService _firestoreService;
        private readonly IAmazonS3 _s3Client;
        private readonly FirestoreDb _firestoreDb;
        private readonly string _bucketName;
        private readonly ILogger<ImagesService> _logger;

        public ImagesService(R2CloudflareService r2CloudflareService, FirestoreService firestoreService, ILogger<ImagesService> logger)
        {
            _r2CloudflareService = r2CloudflareService;
            _firestoreService = firestoreService;
            _s3Client = _r2CloudflareService.GetR2Client();
            _bucketName = _r2CloudflareService.GetR2BucketName();
            _firestoreDb = _firestoreService.GetFirestoreDb();
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(string canvasId, IFormFile imageFile, string uid)
        {
            bool isOwner = await _firestoreService.IsOwnerAsync(canvasId, uid, "canvases");
            if (!isOwner) throw new UnauthorizedAccessException("You do not have permission to upload this image.");

            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(imageFile.FileName)}";
            string filePath = $"{uid}/{canvasId}/{fileName}";

            using (var memoryStream = new MemoryStream())
            {
                await imageFile.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                await _s3Client.PutObjectAsync(new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = filePath,
                    InputStream = memoryStream,
                    ContentType = imageFile.ContentType,
                    DisablePayloadSigning = true
                });
            }

            // §15: Track the upload in Firestore so orphans can be detected later
            var record = new ImageRecord
            {
                ImagePath = filePath,
                CanvasId = canvasId,
                Uid = uid,
                UploadedAt = DateTime.UtcNow
            };
            await _firestoreDb.Collection("images").AddAsync(record);

            return filePath;
        }

        // Uploads / overwrites the canvas preview thumbnail at a fixed key,
        // upserts a deterministic ImageRecord (IsPreview=true), and stamps the
        // canvas document's PreviewImage path + UpdatedAt.
        public async Task<string> UploadPreviewAsync(string canvasId, IFormFile imageFile, string uid)
        {
            bool isOwner = await _firestoreService.IsOwnerAsync(canvasId, uid, "canvases");
            if (!isOwner) throw new UnauthorizedAccessException("You do not have permission to upload this preview.");

            const string fileName = "previewImage.png";
            string filePath = $"{uid}/{canvasId}/{fileName}";

            using (var memoryStream = new MemoryStream())
            {
                await imageFile.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                await _s3Client.PutObjectAsync(new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = filePath,
                    InputStream = memoryStream,
                    ContentType = "image/png",
                    DisablePayloadSigning = true
                });
            }

            // Deterministic doc ID so repeated uploads upsert the same record.
            string recordId = $"{canvasId}_preview";
            var record = new ImageRecord
            {
                ImagePath = filePath,
                CanvasId = canvasId,
                Uid = uid,
                UploadedAt = DateTime.UtcNow,
                IsPreview = true
            };
            await _firestoreDb.Collection("images").Document(recordId).SetAsync(record);

            // Stamp the canvas document so the list endpoint can show the preview.
            await _firestoreDb.Collection("canvases").Document(canvasId).UpdateAsync(new Dictionary<string, object>
            {
                { "PreviewImage", filePath },
                { "UpdatedAt", DateTime.UtcNow }
            });

            return filePath;
        }

        internal (string pathUserId, string pathCanvasId) ValidateAndParsePath(string imagePath, string uid)
        {
            string[] parts = imagePath.Split('/');

            if (parts.Length < 3 || parts.Any(p => p == ".." || p == "." || string.IsNullOrEmpty(p)))
                throw new UnauthorizedOperationException("access this image");

            string pathUserId = parts[0];
            string pathCanvasId = parts[1];

            if (pathUserId != uid)
                throw new UnauthorizedOperationException("access this image");

            return (pathUserId, pathCanvasId);
        }

        public async Task<(Stream ImageStream, string ContentType)> GetImageAsync(string imagePath, string uid)
        {
            var (_, pathCanvasId) = ValidateAndParsePath(imagePath, uid);

            bool isOwner = await _firestoreService.IsOwnerAsync(pathCanvasId, uid, "canvases");
            if (!isOwner) throw new UnauthorizedOperationException("view this image");

            var request = new GetObjectRequest { BucketName = _bucketName, Key = imagePath };

            try
            {
                var response = await _s3Client.GetObjectAsync(request);
                string contentType = Utils.GetContentTypeFromPath(imagePath);
                return (response.ResponseStream, contentType);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new ImageNotFoundException(imagePath);
            }
        }

        public async Task DeleteImageAsync(string imagePath, string uid)
        {
            var (_, pathCanvasId) = ValidateAndParsePath(imagePath, uid);

            bool isOwner = await _firestoreService.IsOwnerAsync(pathCanvasId, uid, "canvases");
            if (!isOwner) throw new UnauthorizedOperationException("delete this image");

            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = imagePath
            });

            // Also remove the Firestore tracking record if one exists
            await DeleteImageRecordAsync(imagePath);
        }

        /// <summary>
        /// §15: Deletes from R2 (and Firestore) any images tracked for <paramref name="canvasId"/>
        /// that are not present in <paramref name="referencedPaths"/>.
        /// Called on every canvas save to clean up images that were uploaded but never saved,
        /// or that were removed from the canvas before the next save.
        /// </summary>
        public async Task CleanOrphanedImagesAsync(string canvasId, IEnumerable<string> referencedPaths)
        {
            var referencedSet = new HashSet<string>(referencedPaths, StringComparer.Ordinal);

            QuerySnapshot snapshot = await _firestoreDb.Collection("images")
                .WhereEqualTo("CanvasId", canvasId)
                .GetSnapshotAsync();

            var orphans = snapshot.Documents
                .Select(d => d.ConvertTo<ImageRecord>())
                .Where(r => !r.IsPreview && !referencedSet.Contains(r.ImagePath))
                .ToList();

            if (orphans.Count == 0) return;

            foreach (var orphan in orphans)
            {
                try
                {
                    await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
                    {
                        BucketName = _bucketName,
                        Key = orphan.ImagePath
                    });
                    await _firestoreDb.Collection("images").Document(orphan.Id).DeleteAsync();
                    _logger.LogInformation("Orphan cleaned: {ImagePath} (canvas {CanvasId})", orphan.ImagePath, canvasId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to clean orphan {ImagePath}: {Reason}", orphan.ImagePath, ex.Message);
                }
            }
        }

        /// <summary>
        /// §15: Deletes all R2 objects under the canvas prefix and removes all Firestore tracking records.
        /// Called when a canvas is deleted.
        /// </summary>
        public async Task DeleteAllCanvasImagesAsync(string uid, string canvasId)
        {
            string prefix = $"{uid}/{canvasId}/";

            var listResponse = await _s3Client.ListObjectsV2Async(new ListObjectsV2Request
            {
                BucketName = _bucketName,
                Prefix = prefix
            });

            if (listResponse.S3Objects.Count > 0)
            {
                await _s3Client.DeleteObjectsAsync(new DeleteObjectsRequest
                {
                    BucketName = _bucketName,
                    Objects = listResponse.S3Objects.Select(obj => new KeyVersion { Key = obj.Key }).ToList()
                });
            }

            // Clean Firestore tracking records for this canvas
            QuerySnapshot snapshot = await _firestoreDb.Collection("images")
                .WhereEqualTo("CanvasId", canvasId)
                .GetSnapshotAsync();

            var batch = _firestoreDb.StartBatch();
            foreach (var doc in snapshot.Documents)
                batch.Delete(doc.Reference);
            await batch.CommitAsync();
        }

        // Removes the Firestore tracking record for a single image path (best-effort).
        private async Task DeleteImageRecordAsync(string imagePath)
        {
            QuerySnapshot snapshot = await _firestoreDb.Collection("images")
                .WhereEqualTo("ImagePath", imagePath)
                .Limit(1)
                .GetSnapshotAsync();

            if (snapshot.Count > 0)
                await snapshot.Documents[0].Reference.DeleteAsync();
        }
    }
}
