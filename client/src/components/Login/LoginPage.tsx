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
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/canvas-selection");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    try {
      await login();
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Background glow blobs */}
      <div
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.62 0.2 275)" }}
      />
      <div
        className="absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "oklch(0.55 0.22 290)" }}
      />

      <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Magic Boards
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your infinite canvas workspace
          </p>
        </div>

        {/* Card */}
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Card className="border border-primary/15 shadow-2xl shadow-primary/5">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">
                Welcome back
              </CardTitle>
              <CardDescription className="text-center">
                Sign in to continue creating
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-5 transition-all hover:shadow-md hover:border-primary/30"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn || isLoading}
              >
                {isLoggingIn ? (
                  <span>Connecting...</span>
                ) : (
                  <>
                    <FcGoogle className="size-5" />
                    <span>Continue with Google</span>
                  </>
                )}
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
