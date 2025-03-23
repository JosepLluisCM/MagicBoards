using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using System.Text.Json;
using System.Net;

namespace server.Services
{
    public class R2Credentials
    {
        public string TokenValue { get; set; } = string.Empty;
        public string AccessKeyId { get; set; } = string.Empty;
        public string SecretAccessKey { get; set; } = string.Empty;
        public string BucketName { get; set; } = string.Empty;
        public string ClientEndpoint { get; set; } = string.Empty;
    }
    public class R2CloudflareService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public R2CloudflareService()
        {
            var r2CredentialsPath = Environment.GetEnvironmentVariable("CLOUDFLARE_R2_CREDENTIALS");

            if (string.IsNullOrEmpty(r2CredentialsPath) || !File.Exists(r2CredentialsPath))
            {
                throw new FileNotFoundException("R2 credentials file not found", r2CredentialsPath);
            }

            // Read and parse the credentials file
            var credentialsJson = File.ReadAllText(r2CredentialsPath);
            var credentials = JsonSerializer.Deserialize<R2Credentials>(credentialsJson)
                ?? throw new InvalidOperationException("Failed to parse R2 credentials");

            _bucketName = credentials.BucketName;

            var awsCredentials = new BasicAWSCredentials(credentials.AccessKeyId, credentials.SecretAccessKey);
            var config = new AmazonS3Config
            {
                ServiceURL = credentials.ClientEndpoint,
                ForcePathStyle = true,
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
            };

            _s3Client = new AmazonS3Client(awsCredentials, config);
        }

        public string GetR2BucketName() => _bucketName;
        public IAmazonS3 GetR2Client() => _s3Client;
    }
}
