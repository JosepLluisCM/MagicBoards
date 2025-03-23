import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Flex, Button } from "@chakra-ui/react";

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
  const navigate = useNavigate();
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
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
        if (!stageInstance) return;

        const pointerPositionRaw = stageInstance.getPointerPosition();
        let x, y;

        if (pointerPositionRaw) {
          // If we have a pointer position, place the image there
          const transform = stageInstance
            .getAbsoluteTransform()
            .copy()
            .invert();
          const pos = transform.point(pointerPositionRaw);
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

  // Update the transformer reference and behavior based on selectedId
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node by id
      const node = transformerRef.current.getStage()?.findOne(`#${selectedId}`);
      if (node) {
        // Reset scale to 1 to avoid compounding scale issues
        node.scaleX(1);
        node.scaleY(1);

        transformerRef.current.nodes([node]);
        // Enable/disable keeping ratio based on Ctrl key state
        transformerRef.current.keepRatio(!isCtrlPressed);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, isCtrlPressed]);

  const handleTransformEnd = (id: string) => {
    if (!canvasData) return;

    // Find the node to get its new properties
    const stage = stageRef.current;
    if (!stage) return;

    const node = stage.findOne(`#${id}`);
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

  // React event handlers for the Box component
  const handleBoxWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stagePosition.scale;
    const newScale = e.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

    const limitedScale = Math.max(0.1, Math.min(newScale, 10));

    // Since we can't use stage.getPointerPosition() here,
    // calculate based on the client rect and mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mousePointTo = {
      x: (mouseX - stagePosition.x) / oldScale,
      y: (mouseY - stagePosition.y) / oldScale,
    };

    const newPos = {
      x: mouseX - mousePointTo.x * limitedScale,
      y: mouseY - mousePointTo.y * limitedScale,
    };

    setStagePosition({
      x: newPos.x,
      y: newPos.y,
      scale: limitedScale,
    });
  };

  const handleBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Middle mouse button (button 1)
    if (e.button === 1) {
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleBoxMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.preventDefault();

      setStagePosition({
        ...stagePosition,
        x: stagePosition.x + e.movementX,
        y: stagePosition.y + e.movementY,
      });
    }
  };

  const handleBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      setIsPanning(false);
    }
  };

  const handleBoxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(e as unknown as KeyboardEvent);
  };

  const handleBoxKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyUp(e as unknown as KeyboardEvent);
  };

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

  const handleDeleteSelected = () => {
    if (canvasData && selectedId) {
      setCanvasData({
        ...canvasData,
        elements: canvasData.elements.filter((el) => el.id !== selectedId),
      });
      setSelectedId(null);
    }
  };

  const handleResetView = () => {
    setStagePosition({ x: 0, y: 0, scale: 1 });
  };

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      // Apply any pending transformations to the previously selected node
      if (selectedId) {
        handleTransformEnd(selectedId);
      }
      setSelectedId(null);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      overflow="hidden"
      tabIndex={0}
      onKeyDown={handleBoxKeyDown}
      onKeyUp={handleBoxKeyUp}
      onWheel={handleBoxWheel}
      onMouseDown={handleBoxMouseDown}
      onMouseMove={handleBoxMouseMove}
      onMouseUp={handleBoxMouseUp}
    >
      <Flex position="absolute" top="4" left="4" gap="2" zIndex="10">
        <Button onClick={() => navigate("/")} colorScheme="blue" size="sm">
          Back to Selection
        </Button>
        <Button onClick={handleAddImageClick} colorScheme="blue" size="sm">
          Add Image
        </Button>
        <Button onClick={handleDeleteSelected} colorScheme="red" size="sm">
          Delete Selected
        </Button>
        <Button onClick={handleResetView} size="sm" colorScheme="purple">
          Reset View
        </Button>
      </Flex>

      {isCtrlPressed && selectedId && (
        <Box
          position="absolute"
          top="14"
          left="4"
          bg="black"
          color="white"
          p="2"
          borderRadius="md"
          fontSize="sm"
          zIndex="10"
        >
          Free Resize Mode
        </Box>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stagePosition.scale}
        scaleY={stagePosition.scale}
        onClick={checkDeselect}
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
                  onClick={() => handleSelectImage(element.id)}
                  onTap={() => handleSelectImage(element.id)}
                  onDragStart={() => handleDragStart(element.id)}
                  onDragEnd={(e) => {
                    handleDragEnd(element.id, e.target.x(), e.target.y());
                  }}
                  onTransformEnd={() => handleTransformEnd(element.id)}
                />
              );
            }
            return null;
          })}
          {selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to a minimal size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </Box>
  );
};

export default Canvas;
