import { BrowserRouter, Routes, Route } from "react-router";
import Canvas from "./components/Canvas/Canvas";
import CanvasSelection from "./components/CanvasSelection/CanvasSelection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CanvasSelection />} />
        <Route path="/canvas/:id" element={<Canvas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
