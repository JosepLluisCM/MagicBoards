namespace server.Models.Requests
{
    public class LoginRequest
    {
        public required string Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? AvatarUrl { get; set; }
        public required string IdToken { get; set; }
        public string? Ip { get; set; }
        public string? UserAgent { get; set; }
    }
}
