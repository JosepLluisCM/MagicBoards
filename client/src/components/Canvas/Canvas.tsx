import { useEffect, useState, useRef } from "react";
import {
  Stage,
  Layer,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { getCanvas, updateCanvas } from "@/api/services/CanvasService";
import {
  uploadImage,
  getImage,
  deleteImage,
} from "@/api/services/ImagesService";
import { generateId } from "@/utils/idUtils";
import {
  Canvas as CanvasType,
  CanvasElement,
  CanvasElementType,
} from "@/types/canvas";

const Canvas = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  //#region STATE
  const [canvas, setCanvas] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<
    Record<string, HTMLImageElement>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  //#endregion STATE

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<any>(null);

  const MIN_ELEMENT_SIZE = 20;
  const MAX_ELEMENT_SIZE = 2000;
  const MAX_TEXT_WIDTH = 1000;

  //#region EFFECTS
  // Fetch canvas data from API
  useEffect(() => {
    const fetchCanvasData = async () => {
      if (!id) {
        setError("No canvas ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const canvasData = await getCanvas(id);

        // Make sure each element has all required properties
        const normalizedElements = canvasData.elements.map((element) => {
          return {
            ...element,
            data: {
              ...element.data,
              position: {
                x: element.data.position.x || 0,
                y: element.data.position.y || 0,
                zIndex: element.data.position.zIndex || 0,
              },
              size: {
                width: element.data.size.width || 100,
                height: element.data.size.height || 100,
              },
              // Ensure rotation is a number, defaulting to 0 if not present
              rotation:
                typeof element.data.rotation === "number"
                  ? element.data.rotation
                  : 0,
            },
          };
        });

        setCanvas({
          ...canvasData,
          elements: normalizedElements,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching canvas:", err);
        setError("Failed to load canvas");
        setLoading(false);
      }
    };

    fetchCanvasData();
  }, [id]);

  // Load images for image elements
  useEffect(() => {
    if (!canvas) return;

    const imageElements = canvas.elements.filter(
      (el) => el.type === CanvasElementType.Image && el.imageId
    );

    imageElements.forEach(async (element) => {
      if (element.imageId && !loadedImages[element.imageId]) {
        try {
          // Get the image from the server using the imageId
          const imageUrl = await getImage(element.imageId);

          // Create a new image from the blob URL
          const img = new Image();
          img.src = imageUrl;
          img.onload = () => {
            setLoadedImages((prev) => ({
              ...prev,
              [element.imageId]: img,
            }));
          };
        } catch (err) {
          console.error("Error loading image:", err);
        }
      }
    });
  }, [canvas, loadedImages]);

  // Handle window resize
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

  // Handle component unmount
  useEffect(() => {
    return () => {
      // Clean up any blob URLs to prevent memory leaks
      Object.values(loadedImages).forEach((img) => {
        if (img.src.startsWith("blob:")) {
          URL.revokeObjectURL(img.src);
        }
      });
    };
  }, [loadedImages]);

  // Add keyboard event handler for delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedId && canvas) {
        const selectedElement = canvas.elements.find(
          (el) => el.id === selectedId
        );

        if (selectedElement) {
          if (selectedElement.type === CanvasElementType.Text) {
            // For text elements, just remove from canvas
            handleDeleteElement();
          } else if (selectedElement.type === CanvasElementType.Image) {
            // For images, use the delete image function
            handleDeleteImage();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, canvas]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node by id
      const stage = transformerRef.current.getStage();
      const selectedNode = stage?.findOne(`#${selectedId}`);

      if (selectedNode) {
        // Attach transformer to the selected node
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        // Clear transformer if node not found
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      // Clear transformer if no selection
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);
  //#endregion EFFECTS

  //#region HANDLERS
  // Save canvas updates to API - only called when Save button is clicked
  const saveCanvas = async () => {
    if (!canvas) return;

    try {
      await updateCanvas(canvas);
      setHasUnsavedChanges(false);
      console.log("Canvas saved successfully");
    } catch (err) {
      console.error("Error saving canvas:", err);
      setError("Failed to save canvas");
    }
  };

  // Handle image upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !id) return;

    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      try {
        setIsUploading(true);

        // Upload the image to the backend and get the path/imageId
        const imagePath = await uploadImage(selectedFile, {
          canvasId: id,
          userId: "ADMIN",
        });

        console.log("Image uploaded, path:", imagePath);

        // Get the actual image data from the server
        const imageUrl = await getImage(imagePath);
        console.log("Image URL created:", imageUrl);

        const elementId = generateId();

        // Create a new element with the image path as the imageId
        const newElement: CanvasElement = {
          id: elementId,
          type: CanvasElementType.Image,
          data: {
            position: {
              x: 300,
              y: 100,
              zIndex: canvas.elements.length + 1,
            },
            size: {
              width: 200,
              height: 200,
            },
            rotation: 0,
          },
          content: "", // Content is not used for images
          imageId: imagePath, // Store the path as the imageId
        };

        // Add image to loaded images
        const img = new Image();
        img.src = imageUrl;

        // Set a timeout to reset uploading state if the image load takes too long
        const resetTimeout = setTimeout(() => {
          setIsUploading(false);
        }, 5000);

        img.onerror = () => {
          console.error("Failed to load image:", imageUrl);
          clearTimeout(resetTimeout);
          setIsUploading(false);
        };

        img.onload = async () => {
          clearTimeout(resetTimeout);
          setLoadedImages((prev) => ({
            ...prev,
            [imagePath]: img, // Use imagePath as the key
          }));

          // Update canvas with new element
          const updatedCanvas = {
            ...canvas,
            elements: [...canvas.elements, newElement],
            updatedAt: new Date().toISOString(),
          };

          setCanvas(updatedCanvas);
          setHasUnsavedChanges(true);

          // Save canvas to server immediately
          try {
            await updateCanvas(updatedCanvas);
            setHasUnsavedChanges(false);
            console.log("Canvas saved after image upload");
          } catch (err) {
            console.error("Error saving canvas after upload:", err);
            // Keep hasUnsavedChanges true so user can retry save
          }

          setIsUploading(false);
        };
      } catch (err) {
        console.error("Error uploading image:", err);
        setError("Failed to upload image");
        setIsUploading(false);
      }
    }
  };

  // Handle text addition
  const handleAddText = () => {
    if (textInputRef.current) {
      textInputRef.current.style.display = "block";
      textInputRef.current.focus();
    }
  };

  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canvas || !textInputRef.current) return;

    if (e.key === "Enter" && textInputRef.current.value.trim()) {
      const text = textInputRef.current.value.trim();
      const elementId = generateId();

      const fontSize = 20; // Base font size
      const approxCharWidth = fontSize; // Approximate character width
      const textWidth = Math.max(50, text.length * approxCharWidth); // Min width 200px
      const textHeight = Math.max(50, fontSize * 1.5); // Give enough height for the text
      // Create a new text element
      const newElement: CanvasElement = {
        id: elementId,
        type: CanvasElementType.Text,
        data: {
          position: {
            x: 300,
            y: 200,
            zIndex: 0,
          },
          size: {
            width: textWidth,
            height: textHeight,
          },
          rotation: 0,
        },
        content: text,
        imageId: "", // Not used for text
      };

      // Update canvas
      setCanvas((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          elements: [...prev.elements, newElement],
          updatedAt: new Date().toISOString(),
        };
      });

      // Clear input and hide
      textInputRef.current.value = "";
      textInputRef.current.style.display = "none";

      setHasUnsavedChanges(true);

      // Select the newly created text element
      setSelectedId(elementId);
    }
  };

  // Handle element drag end
  const handleDragEnd = (e: any, elementId: string) => {
    if (!canvas) return;

    setCanvas((prev) => {
      if (!prev) return prev;

      const updatedElements = prev.elements.map((el) => {
        if (el.id === elementId) {
          return {
            ...el,
            data: {
              ...el.data,
              position: {
                ...el.data.position,
                x: e.target.x(),
                y: e.target.y(),
              },
            },
          };
        }
        return el;
      });

      return {
        ...prev,
        elements: updatedElements,
        updatedAt: new Date().toISOString(),
      };
    });

    setHasUnsavedChanges(true);
  };

  // Handle image deletion
  const handleDeleteImage = async () => {
    if (!canvas || !selectedId) return;

    // Find the selected element
    const selectedElement = canvas.elements.find((el) => el.id === selectedId);
    if (!selectedElement || selectedElement.type !== CanvasElementType.Image)
      return;

    try {
      // Delete image from server
      await deleteImage(selectedElement.imageId);

      // Remove image from loadedImages
      setLoadedImages((prev) => {
        const newImages = { ...prev };
        delete newImages[selectedElement.imageId];
        return newImages;
      });

      // Remove element from canvas
      const updatedCanvas = {
        ...canvas,
        elements: canvas.elements.filter((el) => el.id !== selectedId),
        updatedAt: new Date().toISOString(),
      };

      setCanvas(updatedCanvas);

      // Clear selection
      setSelectedId(null);
      setHasUnsavedChanges(true);

      // Save canvas to server immediately
      try {
        await updateCanvas(updatedCanvas);
        setHasUnsavedChanges(false);
        console.log("Canvas saved after image deletion");
      } catch (err) {
        console.error("Error saving canvas after deletion:", err);
        // Keep hasUnsavedChanges true so user can retry save
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      setError("Failed to delete image");
    }
  };

  // Handle text deletion
  const handleDeleteElement = async () => {
    if (!canvas || !selectedId) return;

    // Find the selected element
    const selectedElement = canvas.elements.find((el) => el.id === selectedId);
    if (!selectedElement) return;

    // Remove element from canvas
    const updatedCanvas = {
      ...canvas,
      elements: canvas.elements.filter((el) => el.id !== selectedId),
      updatedAt: new Date().toISOString(),
    };

    setCanvas(updatedCanvas);

    // Clear selection
    setSelectedId(null);
    setHasUnsavedChanges(true);

    // Save canvas to server immediately
    try {
      await updateCanvas(updatedCanvas);
      setHasUnsavedChanges(false);
      console.log("Canvas saved after element deletion");
    } catch (err) {
      console.error("Error saving canvas after element deletion:", err);
    }
  };

  // Handle element transform end (resize/rotate)
  const handleTransformEnd = (e: any, elementId: string) => {
    if (!canvas) return;

    // Get the node to access its new properties
    const node = e.target;

    // Get the original element
    const element = canvas.elements.find((el) => el.id === elementId);
    if (!element) return;

    // Calculate new dimensions and rotation, accounting for scale
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Apply size limits based on element type
    let newWidth, newHeight;

    if (element.type === CanvasElementType.Text) {
      newWidth = Math.min(
        MAX_TEXT_WIDTH,
        Math.max(MIN_ELEMENT_SIZE, element.data.size.width * scaleX)
      );
      newHeight = Math.max(MIN_ELEMENT_SIZE, element.data.size.height * scaleY);
    } else {
      newWidth = Math.min(
        MAX_ELEMENT_SIZE,
        Math.max(MIN_ELEMENT_SIZE, element.data.size.width * scaleX)
      );
      newHeight = Math.min(
        MAX_ELEMENT_SIZE,
        Math.max(MIN_ELEMENT_SIZE, element.data.size.height * scaleY)
      );
    }
    const newRotation = node.rotation();

    // Reset scale on the node itself, as we've applied it to the width/height
    node.scaleX(1);
    node.scaleY(1);

    // Update canvas with new element properties
    const updatedCanvas = {
      ...canvas,
      elements: canvas.elements.map((el) => {
        if (el.id === elementId) {
          return {
            ...el,
            data: {
              ...el.data,
              position: {
                ...el.data.position,
                x: node.x(),
                y: node.y(),
              },
              size: {
                width: newWidth,
                height: newHeight,
              },
              rotation: newRotation,
            },
          };
        }
        return el;
      }),
      updatedAt: new Date().toISOString(),
    };

    setCanvas(updatedCanvas);
    setHasUnsavedChanges(true);

    // No immediate save to server - user will need to click Save button
  };
  //#endregion HANDLERS

  //#region RENDER HELPERS
  // Get the selected element
  const selectedElement =
    selectedId && canvas
      ? canvas.elements.find((el) => el.id === selectedId)
      : null;

  // Check if the selected element is an image or text
  const isImageSelected = selectedElement?.type === CanvasElementType.Image;
  const isTextSelected = selectedElement?.type === CanvasElementType.Text;
  //#endregion RENDER HELPERS

  //#region RENDERING
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading canvas...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!canvas)
    return (
      <div className="flex items-center justify-center h-screen">
        Canvas not found
      </div>
    );

  return (
    <div className="w-screen h-screen overflow-hidden" tabIndex={0}>
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button
          onClick={() => navigate("/canvas-selection")}
          size="sm"
          variant="default"
        >
          Back to Selection
        </Button>
        <Button
          onClick={handleUploadClick}
          size="sm"
          variant="default"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        <Button onClick={handleAddText} size="sm" variant="default">
          Add Text
        </Button>
        {isImageSelected && (
          <Button onClick={handleDeleteImage} size="sm" variant="destructive">
            Delete Image
          </Button>
        )}
        {isTextSelected && (
          <Button onClick={handleDeleteElement} size="sm" variant="destructive">
            Delete Text
          </Button>
        )}
        <Button
          onClick={saveCanvas}
          size="sm"
          variant={hasUnsavedChanges ? "destructive" : "default"}
          disabled={!hasUnsavedChanges}
        >
          {hasUnsavedChanges ? "Save*" : "Save"}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="text"
          ref={textInputRef}
          style={{
            display: "none",
            position: "absolute",
            top: "60px",
            left: "10px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            zIndex: 1000,
          }}
          placeholder="Enter text and press Enter"
          onKeyDown={handleTextInputKeyDown}
        />
      </div>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onClick={(e) => {
          // Deselect when clicking on empty stage
          if (e.target === e.target.getStage()) {
            setSelectedId(null);
          }
        }}
      >
        <Layer>
          {canvas.elements.map((element) => {
            if (element.type === CanvasElementType.Image) {
              const image = loadedImages[element.imageId];
              if (!image) return null;

              return (
                <KonvaImage
                  key={element.id}
                  id={element.id}
                  image={image}
                  x={element.data.position.x}
                  y={element.data.position.y}
                  width={element.data.size.width}
                  height={element.data.size.height}
                  rotation={element.data.rotation || 0}
                  draggable
                  onClick={() => setSelectedId(element.id)}
                  onTap={() => setSelectedId(element.id)}
                  onDragEnd={(e) => handleDragEnd(e, element.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, element.id)}
                />
              );
            }

            if (element.type === CanvasElementType.Text) {
              // Make font size proportional to the element height
              const fontSize = Math.max(12, element.data.size.height * 0.9);

              return (
                <Text
                  key={element.id}
                  id={element.id}
                  text={element.content}
                  x={element.data.position.x}
                  y={element.data.position.y}
                  width={element.data.size.width}
                  fontSize={fontSize}
                  fontFamily="Arial"
                  fill="white"
                  rotation={element.data.rotation}
                  draggable
                  onClick={() => setSelectedId(element.id)}
                  onTap={() => setSelectedId(element.id)}
                  onDragEnd={(e) => handleDragEnd(e, element.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, element.id)}
                  verticalAlign="middle"
                  align="center"
                  wrap="word"
                />
              );
            }

            return null;
          })}
          <Transformer
            centeredScaling
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to a minimum size
              if (newBox.width < 50 || newBox.height < 50) {
                return oldBox;
              }
              return newBox;
            }}
            anchorSize={8}
            anchorCornerRadius={4}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-right",
              "middle-left",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]}
          />
        </Layer>
      </Stage>
    </div>
  );
  //#endregion RENDERING
};

export default Canvas;
