namespace server.Services
{
    public class CanvasesService
    {
        private readonly FirestoreService _firestoreService;

        public CanvasesService(FirestoreService firestoreService)
        {
            _firestoreService = firestoreService;
        }
    }
}
