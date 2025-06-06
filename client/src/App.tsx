import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { UserAvatar } from "./components/Avatar/UserAvatar";
import { useAuth } from "./contexts/AuthContext";

import Canvas from "./components/Canvas/Canvas";
import CanvasSelection from "./components/CanvasSelection/CanvasSelection";
import LoginPage from "./components/Login/LoginPage";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Smart redirect component based on auth state
function ProtectedRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }
  return isAuthenticated ? (
    <Navigate to="/canvas-selection" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen w-full relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <UserAvatar />
              <ModeToggle />
            </div>
            <Routes>
              <Route path="/" element={<ProtectedRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/canvas-selection" element={<CanvasSelection />} />
              <Route path="/canvas/:id" element={<Canvas />} />
              {/* Smart catch-all route */}
              <Route path="*" element={<ProtectedRedirect />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
