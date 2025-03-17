import { useState } from "react";
import Canvas from "./components/canvas";
import { BrowserRouter } from "react-router";

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Canvas />
    </BrowserRouter>
  );
}

export default App;
