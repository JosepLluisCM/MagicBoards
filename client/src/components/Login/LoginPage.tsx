import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Mock login - will be replaced with actual authentication later
    toast.success("Logged in successfully!");
    // Redirect to canvas selection after login
    setTimeout(() => {
      navigate("/canvas-selection");
    }, 1000);
  };

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-muted">
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome</CardTitle>
              <CardDescription className="text-center">
                Sign in to continue to Magic Boards
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                className="w-full flex items-center justify-center gap-2 py-5 transition-all hover:shadow-md"
                onClick={handleGoogleLogin}
              >
                <FcGoogle className="size-5" />
                <span>Continue with Google</span>
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
