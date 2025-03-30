// using Google.Cloud.Firestore;

// namespace server.Utilities
// {
//     public static class TimeConverter
//     {
//         // Convert Firestore Timestamp to UTC DateTime
//         public static DateTime ToUniversalTime(Timestamp timestamp)
//         {
//             return timestamp.ToDateTime().ToUniversalTime();
//         }
        
//         // Convert DateTime to Firestore Timestamp (always storing in UTC)
//         public static Timestamp ToFirestoreTime(DateTime dateTime)
//         {
//             return Timestamp.FromDateTime(dateTime.ToUniversalTime());
//         }
        
//         // Format DateTime for display (if needed)
//         public static string FormatDateTime(DateTime dateTime, string format = "yyyy-MM-dd HH:mm:ss")
//         {
//             return dateTime.ToString(format);
//         }
//     }
// }