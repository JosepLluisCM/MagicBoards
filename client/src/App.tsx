import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "./components/ui/mode-toggle";
import { Toaster } from "./components/ui/sonner";

import Canvas from "./components/Canvas/Canvas";
import CanvasSelection from "./components/CanvasSelection/CanvasSelection";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen w-full relative">
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/canvas-selection" replace />}
            />
            <Route path="/canvas-selection" element={<CanvasSelection />} />
            <Route path="/canvas/:id" element={<Canvas />} />
          </Routes>
        </BrowserRouter>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
