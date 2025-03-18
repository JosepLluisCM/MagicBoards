using Google.Cloud.Firestore;

namespace server.Models
{
    [FirestoreData]
    public class User
    {
        [FirestoreProperty]
        public string Id { get; set; }  // Firebase Auth User ID

        [FirestoreProperty]
        public string Email { get; set; }  // User's email address

        [FirestoreProperty]
        public string DisplayName { get; set; } = string.Empty;  // User's display name

        [FirestoreProperty]
        public string ProfilePictureUrl { get; set; } = string.Empty;  // URL to user's profile picture

        [FirestoreProperty]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;  // Account creation timestamp

        [FirestoreProperty]
        public DateTime UpdatedAt { get; set; };  // Account creation timestamp
    }
}