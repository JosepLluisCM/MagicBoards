import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import Canvas from "./components/Canvas/Canvas";
import CanvasSelection from "./components/CanvasSelection/CanvasSelection";
import { ColorModeButton } from "@/components/ui/color-mode";

function App() {
  return (
    <Box minH="100vh" w="100%">
      <Flex position="absolute" top="4" right="4" zIndex="10">
        <ColorModeButton />
      </Flex>
      <BrowserRouter>
        <Routes>
          <Route path="/canvas-selection" element={<CanvasSelection />} />
          <Route path="/canvas/:id" element={<Canvas />} />
        </Routes>
      </BrowserRouter>
    </Box>
  );
}

export default App;
