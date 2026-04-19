using server.Services;
using server.Utilities;
using Xunit;

namespace server.Tests;

// ValidateAndParsePath is internal; InternalsVisibleTo("server.Tests") exposes it.
// These tests verify the path-traversal fix from Sprint 1.
public class ImagesServicePathValidationTests
{
    // ImagesService can't be instantiated without real R2/Firestore deps,
    // so we test ValidateAndParsePath indirectly via a thin subclass that
    // calls it directly (since it's now internal).
    private static (string, string) Validate(string path, string uid)
    {
        // Instantiate via reflection to avoid the full DI chain.
        // We invoke the internal method directly on a null-safe proxy.
        var method = typeof(ImagesService)
            .GetMethod("ValidateAndParsePath",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public)!;

        // We need an instance — bypass the constructor since it requires real services.
        var instance = System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(ImagesService));

        try
        {
            return ((string, string))method.Invoke(instance, [path, uid])!;
        }
        catch (System.Reflection.TargetInvocationException ex)
        {
            throw ex.InnerException!;
        }
    }

    [Fact]
    public void ValidPath_ReturnsUserIdAndCanvasId()
    {
        var (userId, canvasId) = Validate("user123/canvas456/image.jpg", "user123");
        Assert.Equal("user123", userId);
        Assert.Equal("canvas456", canvasId);
    }

    [Fact]
    public void DotDotTraversal_ThrowsUnauthorized()
    {
        Assert.Throws<UnauthorizedOperationException>(() =>
            Validate("user123/../otherUser/canvas/image.jpg", "user123"));
    }

    [Fact]
    public void DotSegment_ThrowsUnauthorized()
    {
        Assert.Throws<UnauthorizedOperationException>(() =>
            Validate("user123/./canvas/image.jpg", "user123"));
    }

    [Fact]
    public void EmptySegment_ThrowsUnauthorized()
    {
        Assert.Throws<UnauthorizedOperationException>(() =>
            Validate("user123//canvas/image.jpg", "user123"));
    }

    [Fact]
    public void WrongUid_ThrowsUnauthorized()
    {
        Assert.Throws<UnauthorizedOperationException>(() =>
            Validate("otherUser/canvas456/image.jpg", "user123"));
    }

    [Fact]
    public void TooFewSegments_ThrowsUnauthorized()
    {
        Assert.Throws<UnauthorizedOperationException>(() =>
            Validate("user123/canvas456", "user123"));
    }
}
