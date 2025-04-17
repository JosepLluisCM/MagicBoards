import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { UserAvatar } from "./components/Avatar/UserAvatar";

import Canvas from "./components/Canvas/Canvas";
import CanvasSelection from "./components/CanvasSelection/CanvasSelection";
import LoginPage from "./components/Login/LoginPage";

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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/canvas-selection" element={<CanvasSelection />} />
              <Route path="/canvas/:id" element={<Canvas />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
