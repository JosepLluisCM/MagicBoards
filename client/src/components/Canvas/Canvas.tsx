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
}

interface StagePosition {
  x: number;
  y: number;
  scale: number;
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
  const [stagePosition, setStagePosition] = useState<StagePosition>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

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

            // Also load stage position if available
            const stagePositionString = localStorage.getItem(
              `canvas_position_${id}`
            );
            if (stagePositionString) {
              try {
                const parsedPosition = JSON.parse(stagePositionString);
                setStagePosition(parsedPosition);
              } catch (error) {
                console.error("Error parsing stage position:", error);
              }
            }

            setCanvasData({
              id,
              name: currentCanvas.name,
              elements: parsedData.elements || [],
            });
          } else {
            // Initialize new canvas data if none exists
            setCanvasData({
              id,
              name: currentCanvas.name,
              elements: [],
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
      const dataToSave = {
        elements: canvasData.elements,
      };
      localStorage.setItem(`canvas_data_${id}`, JSON.stringify(dataToSave));
    }
  }, [canvasData, id]);

  // Save stage position when it changes
  useEffect(() => {
    if (id) {
      localStorage.setItem(
        `canvas_position_${id}`,
        JSON.stringify(stagePosition)
      );
    }
  }, [stagePosition, id]);

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

        // Calculate position in the center of the current view
        const stageInstance = stageRef.current;
        const pointerPosition = stageInstance.getPointerPosition();

        let x, y;
        if (pointerPosition) {
          // If we have a pointer position, place the image there
          const transform = stageInstance
            .getAbsoluteTransform()
            .copy()
            .invert();
          const pos = transform.point(pointerPosition);
          x = pos.x - width / 2;
          y = pos.y - height / 2;
        } else {
          // Otherwise, place it in the center of the current view
          x =
            -stagePosition.x / stagePosition.scale +
            dimensions.width / (2 * stagePosition.scale) -
            width / 2;
          y =
            -stagePosition.y / stagePosition.scale +
            dimensions.height / (2 * stagePosition.scale) -
            height / 2;
        }

        const newElement: CanvasElement = {
          id: newElementId,
          type: "image",
          src: result,
          x,
          y,
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
        // Reset scale to 1 to avoid compounding scale issues
        node.scaleX(1);
        node.scaleY(1);

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

    // Get the current element
    const element = canvasData.elements.find((el) => el.id === id);
    if (!element) return;

    // Calculate new width and height while preserving aspect ratio
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Update the element with new position, size, and rotation
    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              x: node.x(),
              y: node.y(),
              width: Math.abs(node.width() * scaleX),
              height: Math.abs(node.height() * scaleY),
              rotation: node.rotation(),
            }
          : el
      ),
    });

    // Reset scale on the node itself, as we've applied it to the width/height
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta") {
      setIsCtrlPressed(true);
    }

    if (e.key === "Delete" && selectedId && canvasData) {
      // Remove the selected element
      setCanvasData({
        ...canvasData,
        elements: canvasData.elements.filter((el) => el.id !== selectedId),
      });
      setSelectedId(null);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta") {
      setIsCtrlPressed(false);
    }
  };

  // Add event listeners for Control key
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedId, canvasData]);

  // Handle wheel event for zooming
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stagePosition.scale;
    const pointerPos = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointerPos.x - stagePosition.x) / oldScale,
      y: (pointerPos.y - stagePosition.y) / oldScale,
    };

    // Calculate new scale
    // Zoom in: scale up, Zoom out: scale down
    const zoomDirection = e.evt.deltaY < 0 ? 1 : -1;
    const SCALE_FACTOR = 1.1;
    const newScale =
      zoomDirection > 0 ? oldScale * SCALE_FACTOR : oldScale / SCALE_FACTOR;

    // Limit the scale to reasonable bounds
    const limitedScale = Math.max(0.1, Math.min(newScale, 10));

    // Calculate new position
    const newPos = {
      x: pointerPos.x - mousePointTo.x * limitedScale,
      y: pointerPos.y - mousePointTo.y * limitedScale,
    };

    setStagePosition({
      x: newPos.x,
      y: newPos.y,
      scale: limitedScale,
    });
  };

  // Handle mouse down for panning
  const handleMouseDown = (e: any) => {
    // Middle mouse button (button 1)
    if (e.evt.button === 1) {
      setIsPanning(true);
      e.evt.preventDefault();
      e.evt.stopPropagation();
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (e: any) => {
    if (isPanning) {
      e.evt.preventDefault();
      const stage = stageRef.current;

      setStagePosition({
        ...stagePosition,
        x: stagePosition.x + e.evt.movementX,
        y: stagePosition.y + e.evt.movementY,
      });
    }
  };

  // Handle mouse up for panning
  const handleMouseUp = (e: any) => {
    if (e.evt.button === 1) {
      setIsPanning(false);
    }
  };

  // Prevent default middle mouse behavior (auto-scroll)
  useEffect(() => {
    const preventMiddleMouseScroll = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("mousedown", preventMiddleMouseScroll);

    return () => {
      document.removeEventListener("mousedown", preventMiddleMouseScroll);
    };
  }, []);

  const handleSelectImage = (id: string) => {
    setSelectedId(id);

    // Ensure any previous transformations are properly applied
    if (transformerRef.current) {
      const nodes = transformerRef.current.nodes();
      if (nodes && nodes.length > 0) {
        const prevNode = nodes[0];
        if (prevNode && prevNode.id() !== id) {
          // Apply any pending transformations to the previously selected node
          handleTransformEnd(prevNode.id());
        }
      }
    }
  };

  return (
    <div className={`canvas-container ${isPanning ? "panning" : ""}`}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        onClick={(e) => {
          // Deselect when clicking on empty area
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) {
            // Apply any pending transformations to the previously selected node
            if (selectedId) {
              handleTransformEnd(selectedId);
            }
            setSelectedId(null);
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stagePosition.scale}
        scaleY={stagePosition.scale}
        draggable={false}
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
                  scaleX={1}
                  scaleY={1}
                  draggable
                  onClick={() => handleSelectImage(element.id)}
                  onTap={() => handleSelectImage(element.id)}
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
            keepRatio={!isCtrlPressed}
            onTransform={() => {
              // Force update on transform to ensure smooth visual feedback
              if (transformerRef.current) {
                transformerRef.current.getLayer().batchDraw();
              }
            }}
          />
        </Layer>
      </Stage>

      <div className="floating-controls">
        <Link to="/" className="floating-button back-button">
          Back to Canvas Selection
        </Link>
        <button
          className="floating-button add-button"
          onClick={handleAddImageClick}
        >
          Add Image
        </button>
        {selectedId && (
          <button
            className="floating-button delete-button"
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
        <button
          className="floating-button reset-button"
          onClick={() => {
            setStagePosition({ x: 0, y: 0, scale: 1 });
          }}
        >
          Reset View
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="canvas-info">
        <span>Zoom: {Math.round(stagePosition.scale * 100)}%</span>
        <span>Pan: Middle Mouse Button</span>
        <span>Zoom: Mouse Wheel</span>
        <span>Free Resize: Hold Ctrl</span>
      </div>
    </div>
  );
};

export default Canvas;
