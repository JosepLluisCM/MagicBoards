import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { useParams, Link } from "react-router";
import "./Canvas.css";

interface CanvasElement {
  id: string;
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isDragging: boolean;
}

interface CanvasData {
  id: string;
  name: string;
  elements: CanvasElement[];
  notes: string;
}

const Canvas = () => {
  const { id } = useParams<{ id: string }>();
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  // Load canvas data from localStorage
  useEffect(() => {
    if (!id) return;

    // First, get the list of canvases to find the name
    const savedCanvases = localStorage.getItem("canvases");
    if (savedCanvases) {
      try {
        const allCanvases = JSON.parse(savedCanvases);
        const currentCanvas = allCanvases.find(
          (canvas: any) => canvas.id === id
        );

        if (currentCanvas) {
          // Try to load canvas-specific data
          const canvasDataString = localStorage.getItem(`canvas_data_${id}`);
          if (canvasDataString) {
            const parsedData = JSON.parse(canvasDataString);
            setCanvasData({
              id,
              name: currentCanvas.name,
              elements: parsedData.elements || [],
              notes: parsedData.notes || "",
            });
          } else {
            // Initialize new canvas data if none exists
            setCanvasData({
              id,
              name: currentCanvas.name,
              elements: [],
              notes: "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading canvas data:", error);
      }
    }
  }, [id]);

  // Load images when canvas data changes
  useEffect(() => {
    if (!canvasData) return;

    const imageElements = canvasData.elements.filter(
      (el) => el.type === "image"
    );
    const newImages: { [key: string]: HTMLImageElement } = {};

    imageElements.forEach((element) => {
      if (!images[element.id]) {
        const img = new Image();
        img.src = element.src;
        newImages[element.id] = img;
      }
    });

    if (Object.keys(newImages).length > 0) {
      setImages((prev) => ({ ...prev, ...newImages }));
    }
  }, [canvasData]);

  // Save canvas data when it changes
  useEffect(() => {
    if (canvasData) {
      localStorage.setItem(`canvas_data_${id}`, JSON.stringify(canvasData));
    }
  }, [canvasData, id]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (canvasData) {
      setCanvasData({
        ...canvasData,
        notes: e.target.value,
      });
    }
  };

  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !canvasData) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (!result || typeof result !== "string") return;

      const newElementId = Date.now().toString();
      const img = new Image();
      img.src = result;

      img.onload = () => {
        // Calculate dimensions to fit the image properly
        const maxWidth = dimensions.width * 0.5;
        const maxHeight = dimensions.height * 0.5;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        if (height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = width * ratio;
        }

        const newElement: CanvasElement = {
          id: newElementId,
          type: "image",
          src: result,
          x: (dimensions.width - 300) / 2 - width / 2,
          y: (dimensions.height - 60) / 2 - height / 2,
          width,
          height,
          rotation: 0,
          isDragging: false,
        };

        // Add the new image to the images state
        setImages((prev) => ({
          ...prev,
          [newElementId]: img,
        }));

        // Add the new element to the canvas data
        setCanvasData({
          ...canvasData,
          elements: [...canvasData.elements, newElement],
        });
      };
    };

    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = "";
  };

  const handleDragStart = (id: string) => {
    if (!canvasData) return;

    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id ? { ...el, isDragging: true } : el
      ),
    });
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    if (!canvasData) return;

    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id ? { ...el, x, y, isDragging: false } : el
      ),
    });
  };

  // Add a new useEffect to handle the transformer
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node by id
      const node = transformerRef.current.getStage().findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  const handleTransformEnd = (id: string) => {
    if (!canvasData) return;

    // Find the node to get its new properties
    const node = stageRef.current.findOne(`#${id}`);
    if (!node) return;

    // Update the element with new position, size, and rotation
    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              x: node.x(),
              y: node.y(),
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
              rotation: node.rotation(),
            }
          : el
      ),
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" && selectedId && canvasData) {
      // Remove the selected element
      setCanvasData({
        ...canvasData,
        elements: canvasData.elements.filter((el) => el.id !== selectedId),
      });
      setSelectedId(null);
    }
  };

  // Add event listener for keyboard events
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, canvasData]);

  return (
    <div className="canvas-container">
      <div className="canvas-header">
        <Link to="/" className="back-button">
          Back to Canvas Selection
        </Link>
        <h2>{canvasData ? canvasData.name : `Canvas ${id}`}</h2>
        <div className="canvas-tools">
          <button className="tool-button" onClick={handleAddImageClick}>
            Add Image
          </button>
          {selectedId && (
            <button
              className="tool-button delete-tool"
              onClick={() => {
                if (canvasData && selectedId) {
                  setCanvasData({
                    ...canvasData,
                    elements: canvasData.elements.filter(
                      (el) => el.id !== selectedId
                    ),
                  });
                  setSelectedId(null);
                }
              }}
            >
              Delete Selected
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div className="canvas-content">
        <Stage
          width={dimensions.width - 300}
          height={dimensions.height - 60}
          ref={stageRef}
          onClick={(e) => {
            // Deselect when clicking on empty area
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {canvasData?.elements.map((element) => {
              if (element.type === "image" && images[element.id]) {
                return (
                  <KonvaImage
                    key={element.id}
                    id={element.id}
                    image={images[element.id]}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    rotation={element.rotation}
                    draggable
                    onClick={() => setSelectedId(element.id)}
                    onTap={() => setSelectedId(element.id)}
                    onDragStart={() => handleDragStart(element.id)}
                    onDragEnd={(e) =>
                      handleDragEnd(element.id, e.target.x(), e.target.y())
                    }
                    onTransformEnd={() => handleTransformEnd(element.id)}
                    shadowColor="black"
                    shadowBlur={element.isDragging ? 10 : 0}
                    shadowOpacity={element.isDragging ? 0.6 : 0}
                    shadowOffsetX={element.isDragging ? 5 : 0}
                    shadowOffsetY={element.isDragging ? 5 : 0}
                  />
                );
              }
              return null;
            })}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to a minimum size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
            />
          </Layer>
        </Stage>
        <div className="canvas-sidebar">
          <h3>Notes</h3>
          <textarea
            className="canvas-notes"
            value={canvasData?.notes || ""}
            onChange={handleNotesChange}
            placeholder="Add notes about this canvas..."
          />
          <div className="canvas-help">
            <h4>Keyboard Shortcuts</h4>
            <ul>
              <li>
                <strong>Delete</strong> - Remove selected image
              </li>
              <li>
                <strong>Click + Drag</strong> - Move image
              </li>
              <li>
                <strong>Click + Corner handles</strong> - Resize image
              </li>
              <li>
                <strong>Click + Edge handles</strong> - Rotate image
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
