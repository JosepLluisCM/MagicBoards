namespace server.Services
{
    public class UsersService
    {
        private readonly FirestoreService _firestoreService;

        public UsersService(FirestoreService firestoreService)
        {
            _firestoreService = firestoreService;
        }

    }
}
