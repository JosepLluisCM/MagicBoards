//using Google.Cloud.Firestore;

//namespace server.Models
//{
//    [FirestoreData]
//    public class UserSession
//    {
//        [FirestoreProperty]
//        public required string Uid { get; set; }  // Firebase Auth User ID

//        [FirestoreProperty]
//        public required string SessionId { get; set; }

//        [FirestoreProperty]
//        public required DateTime IssuedAt { get; set; }

//        [FirestoreProperty]
//        public required DateTime ExpiresAt { get; set; }

//        [FirestoreProperty]
//        public required string Ip { get; set; } // IP from the user device

//        [FirestoreProperty]
//        public required string UserAgent { get; set; } // Device/Browser of the user session

//        [FirestoreProperty]
//        public bool Revoked { get; set; }

//        //CONSTRUCTOR
//        public static UserSession CreateNew(string uid, string sessionId, DateTime issuedAt, DateTime expiresAt, string? ip, string? userAgent)
//        {
//            return new UserSession
//            {
//                Uid = uid,
//                SessionId = sessionId,
//                IssuedAt = issuedAt,
//                ExpiresAt = expiresAt,
//                Ip = ip ?? "",
//                UserAgent = userAgent ?? "",
//                Revoked = false
//            };
//        }
//    }
//}
