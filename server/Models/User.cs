using Google.Cloud.Firestore;
using System.Net.NetworkInformation;

namespace server.Models
{
    public enum Provider
    {
        Google,
        Email
    }

    [FirestoreData]
    public class User
    {
        [FirestoreProperty]
        public required string Uid { get; set; }  // Firebase Auth User ID

        [FirestoreProperty]
        public required string Email { get; set; }

        [FirestoreProperty]
        public required string Name { get; set; }

        [FirestoreProperty]
        public string AvatarUrl { get; set; } = string.Empty;

        [FirestoreProperty]
        public Provider Provider { get; set; }

        [FirestoreProperty]
        public DateTime CreatedAt { get; set; }

        [FirestoreProperty]
        public DateTime LastLogin { get; set; }

        [FirestoreProperty]
        public bool IsAdmin { get; set; }

        [FirestoreProperty]
        public bool VerifiedEmail { get; set; }

        [FirestoreProperty]
        public string? UserAgent { get; set; }

        [FirestoreProperty]
        public string? Ip {  get; set; }

        //CONSTRUCTOR
        public static User CreateNew(string uid, string? email, string? name, string? avatarUrl, string? userAgent, string? ip, Provider provider = Provider.Google)
        {
            return new User
            {
                Uid = uid,
                Email = email ?? "",
                Name = name ?? "NO NAME",
                AvatarUrl = avatarUrl ?? "",
                Provider = provider,
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow,
                IsAdmin = false,
                VerifiedEmail = false,
                UserAgent = userAgent ?? "",
                Ip = ip ?? ""
            };
        }

        public static User Update(User originalUser, string? email, string? name, string? avatarUrl, string? userAgent, string? ip)
        {
            return new User
            {
                Uid = originalUser.Uid,
                Email = email ?? originalUser.Email,
                Name = name ?? originalUser.Name,
                AvatarUrl = avatarUrl ?? originalUser.AvatarUrl,
                Provider = originalUser.Provider,
                CreatedAt = originalUser.CreatedAt,
                LastLogin = DateTime.UtcNow,
                IsAdmin = originalUser.IsAdmin,
                VerifiedEmail = originalUser.VerifiedEmail,
                UserAgent = userAgent ?? "",
                Ip = ip ?? ""
            };
        }
    }
}