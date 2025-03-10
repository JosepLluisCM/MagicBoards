using Microsoft.AspNetCore.Mvc;
using Google.Cloud.Firestore;
using server.Services;


namespace server.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class FirestoreController : ControllerBase
  {
    private readonly FirestoreService _firestoreService;
    private readonly FirestoreDb _firestoreDb;

    // FirestoreService is injected here
    public FirestoreController(FirestoreService firestoreService)
    {
      _firestoreService = firestoreService;
      _firestoreDb = _firestoreService.GetFirestoreDb();
    }

    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments()
    {
      var collection = _firestoreDb.Collection("users");
      var snapshot = await collection.GetSnapshotAsync();
      return Ok(snapshot.Documents.Select(doc => doc.Id));
    }
  }
}
