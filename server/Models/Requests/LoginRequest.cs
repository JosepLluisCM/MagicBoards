using System.ComponentModel.DataAnnotations;

namespace server.Models.Requests
{
    public class LoginRequest
    {
        [Required]
        [MaxLength(128)]
        public required string Id { get; set; }

        [MaxLength(256)]
        public string? Name { get; set; }

        [EmailAddress]
        [MaxLength(256)]
        public string? Email { get; set; }

        [MaxLength(2048)]
        public string? AvatarUrl { get; set; }

        [Required]
        [MaxLength(4096)]
        public required string IdToken { get; set; }

        public string? Ip { get; set; }

        [MaxLength(512)]
        public string? UserAgent { get; set; }
    }
}
