namespace server.Services
{
    public class LogsService
    {
        private readonly FirestoreService _firestoreService;

        public LogsService(FirestoreService firestoreService)
        {
            _firestoreService = firestoreService;
        }
    }
}
