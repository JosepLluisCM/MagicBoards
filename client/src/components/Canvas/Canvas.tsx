import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Flex, Button } from "@chakra-ui/react";
import { getCanvas } from "../../api/services/CanvasService";
import { saveCanvasToServer } from "../../api/services/ServerCanvasService";
import { uploadImage } from "../../api/services/ImagesService";
import { Canvas as CanvasType } from "../../types";
import { toaster } from "../../components/ui/toaster";

// Import Position type from types or redefine here to match server-side
import { Position as ClientPosition } from "../../types";

// Define server-side format interfaces that match the C# models
interface ServerPosition {
  X: number;
  Y: number;
  x?: number;
  y?: number;
}

interface ServerSize {
  Width: number;
  Height: number;
}

interface ServerElementStyle {
  FillColor: string;
  BorderColor: string;
  FontSize: number;
  Color: string;
}

// Update the local element interface to better match the server model
interface CanvasElement {
  id: string;
  type: string;
  src: string;
  imagePath?: string; // Path to image on the server
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isDragging: boolean;
  // Add fields to match expected structure
  content?: string;
  imageId?: string;
  position?: ServerPosition;
  size?: ServerSize;
  style?: ServerElementStyle;
}

interface CanvasData {
  id: string;
  userId: string;
  name: string;
  elements: CanvasElement[];
  createdAt?: Date;
  updatedAt?: Date;
  position?: ServerPosition;
  scale?: number;
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
  const [isSaving, setIsSaving] = useState(false);

  // Load canvas data from API
  useEffect(() => {
    if (!id) return;

    const fetchCanvasData = async () => {
      try {
        const canvas = await getCanvas(id);

        // Convert API elements to our local format
        const convertedElements: CanvasElement[] = (canvas.elements || []).map(
          (el: any) => ({
            id: el.imageId || Date.now().toString(),
            type: el.type,
            src: el.imageId
              ? `${import.meta.env.VITE_API_URL}/images/${el.imageId}`
              : "",
            imagePath: el.imageId,
            // Use position if available, otherwise fallback to direct coordinates
            x: el.position?.X ?? 0,
            y: el.position?.Y ?? 0,
            // Use size if available, otherwise fallback to width/height
            width: el.size?.Width ?? 100,
            height: el.size?.Height ?? 100,
            rotation: el.rotation || 0,
            isDragging: false,
            // Keep original fields
            content: el.content,
            imageId: el.imageId,
            position: {
              X: el.position?.X ?? 0,
              Y: el.position?.Y ?? 0,
            },
            size: {
              width: el.size?.Width ?? 100,
              height: el.size?.Height ?? 100,
              Width: el.size?.Width ?? 100,
              Height: el.size?.Height ?? 100,
            },
            style: el.style,
          })
        );

        // Set canvas data with consistent X/Y properties
        setCanvasData({
          id: canvas.id,
          userId: canvas.userId,
          name: canvas.name,
          elements: convertedElements,
          createdAt: canvas.createdAt,
          updatedAt: canvas.updatedAt,
          position: canvas.position
            ? {
                X: canvas.position.X || 0,
                Y: canvas.position.Y || 0,
              }
            : undefined,
          scale: canvas.scale,
        });

        // Set stage position if it exists in the canvas data
        if (canvas.position) {
          setStagePosition({
            x: canvas.position.X || 0,
            y: canvas.position.Y || 0,
            scale: (canvas.scale || 100) / 100, // Convert percentage scale back to decimal
          });
        }
      } catch (error) {
        console.error("Error fetching canvas data:", error);
        toaster.create({
          title: "Error loading canvas",
          description: "Could not load canvas data from the server.",
          type: "error",
          duration: 5000,
        });
      }
    };

    fetchCanvasData();
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
        // If we have a server imagePath, use the API endpoint to get the image
        if (element.imagePath) {
          img.src = `${import.meta.env.VITE_API_URL}/images/${
            element.imagePath
          }`;
        } else if (element.src) {
          // For backwards compatibility or local files not yet uploaded
          img.src = element.src;
        }
        newImages[element.id] = img;
      }
    });

    if (Object.keys(newImages).length > 0) {
      setImages((prev) => ({ ...prev, ...newImages }));
    }
  }, [canvasData, images]);

  // Save canvas data when it changes
  useEffect(() => {
    if (!canvasData || isSaving) return;

    const saveTimer = setTimeout(async () => {
      try {
        setIsSaving(true);

        // Convert our local elements to the expected API format
        const apiElements = canvasData.elements.map((el) => ({
          Type: el.type,
          Content: el.content || "",
          ImageId: el.imagePath || el.imageId || "",
          Position: {
            X: Math.round(el.x),
            Y: Math.round(el.y),
          },
          Size: {
            Width: Math.round(el.width),
            Height: Math.round(el.height),
          },
          Style: el.style
            ? {
                FillColor: el.style.FillColor || "#000000",
                BorderColor: el.style.BorderColor || "#000000",
                FontSize: el.style.FontSize || 16,
                Color: el.style.Color || "#000000",
              }
            : {
                FillColor: "#000000",
                BorderColor: "#000000",
                FontSize: 16,
                Color: "#000000",
              },
        }));

        // Create a Canvas object that matches the expected server type
        const updatedCanvas = {
          Id: canvasData.id,
          UserId: canvasData.userId,
          Name: canvasData.name,
          Elements: apiElements,
          Position: {
            X: Math.round(stagePosition.x),
            Y: Math.round(stagePosition.y),
          },
          Scale: Math.round(stagePosition.scale * 100), // Scale is stored as percentage in C#
          CreatedAt: canvasData.createdAt || new Date(),
          UpdatedAt: new Date(),
        };

        await saveCanvasToServer(
          updatedCanvas as any, // Type casting as we know the formats will be converted properly
          stagePosition.x,
          stagePosition.y,
          stagePosition.scale
        );
        setIsSaving(false);
      } catch (error) {
        console.error("Error saving canvas data:", error);
        setIsSaving(false);
        toaster.create({
          title: "Error saving changes",
          description: "Could not save canvas changes to the server.",
          type: "error",
          duration: 3000,
        });
      }
    }, 1000); // Debounce updates to avoid too many API calls

    return () => clearTimeout(saveTimer);
  }, [canvasData, stagePosition]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !canvasData) return;

    const file = files[0];

    try {
      // First, upload the image to the server with both userId and canvasId
      const imagePath = await uploadImage(file, {
        userId: canvasData.userId,
        canvasId: canvasData.id,
      });

      // Load the image to get its dimensions
      const img = new Image();

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

        // Get pointer position, or fallback to stage center
        const pointerPos = stageInstance.getPointerPosition();
        let x, y;

        if (pointerPos) {
          // If we have a pointer position, place the image there
          const transform = stageInstance
            .getAbsoluteTransform()
            .copy()
            .invert();
          const pos = transform.point(pointerPos);
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

        const newElementId = Date.now().toString();
        const newElement: CanvasElement = {
          id: newElementId,
          type: "image",
          imagePath: imagePath, // Store the path from the server
          imageId: imagePath, // Also store as imageId for API compatibility
          src: img.src, // We still need this for the image to display locally
          x,
          y,
          width,
          height,
          rotation: 0,
          isDragging: false,
          // Add required fields for API compatibility in C# format
          position: {
            X: Math.round(x),
            Y: Math.round(y),
          },
          size: {
            Width: Math.round(width),
            Height: Math.round(height),
          },
          style: {
            FillColor: "#000000",
            BorderColor: "#000000",
            FontSize: 16,
            Color: "#000000",
          },
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

      // Set the source to the API endpoint for the uploaded image
      img.src = `${import.meta.env.VITE_API_URL}/images/${imagePath}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      toaster.create({
        title: "Error uploading image",
        description: "Could not upload the image to the server.",
        type: "error",
        duration: 5000,
      });
    }

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
        el.id === id
          ? {
              ...el,
              x,
              y,
              isDragging: false,
              position: {
                X: x,
                Y: y,
              },
            }
          : el
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

    const newWidth = Math.abs(node.width() * scaleX);
    const newHeight = Math.abs(node.height() * scaleY);
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

    // Update the element with new position, size, and rotation
    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
              rotation: newRotation,
              // Update the position and size objects as well
              position: {
                X: newX,
                Y: newY,
              },
              size: {
                Width: newWidth,
                Height: newHeight,
              },
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

  // Add a function to manually save the canvas
  const handleSaveCanvas = async () => {
    try {
      // Set the loading state
      setIsSaving(true);

      if (!canvasData) {
        throw new Error("No canvas data to save");
      }

      // Use the new service to save with proper conversion
      await saveCanvasToServer(
        canvasData as any, // Type casting as we know the formats will be converted properly
        stagePosition.x,
        stagePosition.y,
        stagePosition.scale
      );

      toaster.create({
        title: "Canvas saved",
        description: "Your changes have been saved successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving canvas:", error);
      toaster.create({
        title: "Error saving canvas",
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
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
        <Button
          onClick={() => navigate("/canvas-selection")}
          colorScheme="blue"
          size="sm"
        >
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
        <Button
          onClick={handleSaveCanvas}
          size="sm"
          colorScheme="green"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
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
