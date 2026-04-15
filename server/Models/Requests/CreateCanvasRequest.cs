using System.ComponentModel.DataAnnotations;

namespace server.Models.Requests
{
    public class CreateCanvasRequest
    {
        [MaxLength(200)]
        public string? Name { get; set; }
    }
}
