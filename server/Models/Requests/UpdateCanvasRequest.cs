using Google.Cloud.Firestore;
using System.ComponentModel.DataAnnotations;

namespace server.Models.Requests
{
    [FirestoreData]
    public class UpdateCanvasRequest : IValidatableObject
    {
        [FirestoreProperty]
        public required CanvasData Data { get; set; }

        [FirestoreProperty]
        public required List<CanvasElement> Elements { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Elements?.Count > 1000)
                yield return new ValidationResult(
                    "Canvas cannot have more than 1000 elements.",
                    new[] { nameof(Elements) });
        }
    }
}
