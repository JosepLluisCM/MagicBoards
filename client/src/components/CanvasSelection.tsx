import { useState, useEffect } from "react";
import { Link } from "react-router";
import "./CanvasSelection.css";

interface Canvas {
  id: string;
  name: string;
  createdAt: Date;
}

const CanvasSelection = () => {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [newCanvasName, setNewCanvasName] = useState("");

  // Load canvases from localStorage on component mount
  useEffect(() => {
    const savedCanvases = localStorage.getItem("canvases");
    if (savedCanvases) {
      try {
        // Parse the JSON string and convert date strings back to Date objects
        const parsedCanvases = JSON.parse(savedCanvases).map((canvas: any) => ({
          ...canvas,
          createdAt: new Date(canvas.createdAt),
        }));
        setCanvases(parsedCanvases);
      } catch (error) {
        console.error("Error parsing canvases from localStorage:", error);
        // If there's an error, initialize with a default canvas
        setCanvases([
          {
            id: "1",
            name: "My First Canvas",
            createdAt: new Date(),
          },
        ]);
      }
    } else {
      // If no canvases in localStorage, initialize with a default canvas
      setCanvases([
        {
          id: "1",
          name: "My First Canvas",
          createdAt: new Date(),
        },
      ]);
    }
  }, []);

  // Save canvases to localStorage whenever they change
  useEffect(() => {
    if (canvases.length > 0) {
      localStorage.setItem("canvases", JSON.stringify(canvases));
    }
  }, [canvases]);

  const handleCreateCanvas = () => {
    if (!newCanvasName.trim()) return;

    const newCanvas: Canvas = {
      id: Date.now().toString(),
      name: newCanvasName,
      createdAt: new Date(),
    };

    setCanvases([...canvases, newCanvas]);
    setNewCanvasName("");
  };

  const handleDeleteCanvas = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm("Are you sure you want to delete this canvas?")) {
      // Remove the canvas from the state
      const updatedCanvases = canvases.filter((canvas) => canvas.id !== id);
      setCanvases(updatedCanvases);

      // Also remove the canvas data from localStorage
      localStorage.removeItem(`canvas_data_${id}`);
    }
  };

  return (
    <div className="canvas-selection">
      <h1>My Canvases</h1>

      <div className="create-canvas">
        <input
          type="text"
          value={newCanvasName}
          onChange={(e) => setNewCanvasName(e.target.value)}
          placeholder="Enter canvas name"
        />
        <button onClick={handleCreateCanvas}>Create New Canvas</button>
      </div>

      <div className="canvas-grid">
        {canvases.map((canvas) => (
          <div key={canvas.id} className="canvas-item">
            <div className="canvas-item-header">
              <h3>{canvas.name}</h3>
              <button
                className="delete-button"
                onClick={(e) => handleDeleteCanvas(canvas.id, e)}
                title="Delete Canvas"
              >
                ×
              </button>
            </div>
            <p>Created: {canvas.createdAt.toLocaleDateString()}</p>
            <Link to={`/canvas/${canvas.id}`} className="canvas-link">
              Open Canvas
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasSelection;
