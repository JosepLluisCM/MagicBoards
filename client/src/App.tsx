//import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import { Box, Flex } from "@chakra-ui/react";
//import Canvas from "./components/Canvas/Canvas";
//import CanvasSelection from "./components/CanvasSelection/CanvasSelection";
//import { ColorModeButton } from "@/components/ui/color-mode";
import { Button } from "./components/ui/button";
import { ModeToggle } from "./components/ui/mode-toggle";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Button>Click me</Button>
      <ModeToggle />
    </ThemeProvider>

    // <Box minH="100vh" w="100%">
    //   <Flex position="absolute" top="4" right="4" zIndex="10">
    //     <ColorModeButton />
    //   </Flex>
    //   <BrowserRouter>
    //     <Routes>
    //       <Route
    //         path="/"
    //         element={<Navigate to="/canvas-selection" replace />}
    //       />
    //       <Route path="/canvas-selection" element={<CanvasSelection />} />
    //       <Route path="/canvas/:id" element={<Canvas />} />
    //     </Routes>
    //   </BrowserRouter>
    // </Box>
  );
}

export default App;
