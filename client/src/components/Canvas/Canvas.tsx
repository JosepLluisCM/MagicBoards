import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Stage,
  Layer,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { getCanvas, updateCanvas } from "@/api/services/CanvasService";
import {
  uploadImage,
  getImagePresignedUrl,
  getImage,
  deleteImage,
} from "@/api/services/ImagesService";
import { generateId } from "@/utils/idUtils";
import {
  Canvas as CanvasType,
  CanvasElement,
  CanvasElementType,
} from "@/types/canvas";
import useGrid from "./hooks/useGrid";
import { useCanvasHistory } from "./hooks/useCanvasHistory";

const Canvas = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  //#region STATE
  const [canvas, setCanvas] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Use the grid hook
  const {
    stageRef,
    gridLayerRef,
    scale,
    position,
    zoomIn,
    zoomOut,
    resetView,
    handleWheel,
    getCanvasData,
    drawGridLines,
    forceApplyData,
  } = useGrid({
    stepSize: 50,
    gridColor: "rgba(255, 255, 255, 0.2)",
    gridOpacity: 0.2,
    showBorder: false,
    minScale: 0.1,
    maxScale: 5,
    initialCanvasData: canvas?.data,
    onViewChange: () => {
      // Set hasUnsavedChanges to true when position or scale changes
      if (!hasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<any>(null);
  const lastPositionRef = useRef<{
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);
  // Add a timer ref for debouncing
  const debounceTimerRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const { pushSnapshot, undo, redo, canUndo, canRedo } = useCanvasHistory();

  // Add a ref to track if we're currently dragging an element
  const isElementDraggingRef = useRef(false);

  const MIN_ELEMENT_SIZE = 20;
  const MAX_ELEMENT_SIZE = 2000;
  const MAX_TEXT_WIDTH = 1000;

  // Add a debounced version of forceApplyData
  const debouncedForceApplyData = () => {
    // Clear any existing timer
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer
    debounceTimerRef.current = window.setTimeout(() => {
      forceApplyData();
      debounceTimerRef.current = null;
    }, 300); // Wait 300ms after last event
  };

  // Add a function to update canvas data instead of forcing the initial data
  const updateCanvasData = async () => {
    if (!canvas || !stageRef.current) return;

    // Get current position and scale from the stage
    const currentData = {
      scale: stageRef.current.scaleX(),
      position: {
        x: stageRef.current.x(),
        y: stageRef.current.y(),
      },
    };

    // Only update the data property without touching elements
    setCanvas((prevCanvas) => {
      if (!prevCanvas) return prevCanvas;

      return {
        ...prevCanvas,
        data: currentData,
        updatedAt: new Date().toISOString(),
        // Keep the same elements
        elements: prevCanvas.elements,
      };
    });

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  // Add a debounced version of updateCanvasData
  const debouncedUpdateCanvasData = () => {
    // Clear any existing timer
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer
    debounceTimerRef.current = window.setTimeout(() => {
      updateCanvasData();
      debounceTimerRef.current = null;
    }, 300); // Wait 300ms after last event
  };

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

        // Ensure canvas.data exists and has valid position and scale
        if (!canvasData.data) {
          canvasData.data = { position: { x: 0, y: 0 }, scale: 1 };
        } else {
          // Ensure scale is valid
          if (
            typeof canvasData.data.scale !== "number" ||
            canvasData.data.scale <= 0
          ) {
            canvasData.data.scale = 1;
          }

          // Ensure position is valid
          if (!canvasData.data.position) {
            canvasData.data.position = { x: 0, y: 0 };
          }
        }

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

        const normalizedCanvas = {
          ...canvasData,
          elements: normalizedElements,
        };

        // Set canvas with normalized data in a single update to avoid flashing
        setCanvas(normalizedCanvas);
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
          //const imageUrl = await getImagePresignedUrl(element.imageId);

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
  }, [canvas]);

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

  // Auto-save: triggers 2s after last unsaved change
  useEffect(() => {
    if (!hasUnsavedChanges) {
      if (autoSaveTimerRef.current !== null) window.clearTimeout(autoSaveTimerRef.current);
      return;
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveCanvas();
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current !== null) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete / Backspace — delete selected element
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && canvas && !isInputActive()) {
        const selectedElement = canvas.elements.find((el) => el.id === selectedId);
        if (selectedElement) {
          if (selectedElement.type === CanvasElementType.Text) handleDeleteElement();
          else if (selectedElement.type === CanvasElementType.Image) handleDeleteImage();
        }
        return;
      }

      // Escape — deselect
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }

      if (isInputActive()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S — save immediately
      if (ctrl && e.key === "s") {
        e.preventDefault();
        saveCanvas();
        return;
      }

      // Ctrl+Z — undo
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        if (!canvas || !canUndo()) return;
        const restored = undo(canvas.elements);
        if (restored) {
          setCanvas((prev) => prev ? { ...prev, elements: restored, updatedAt: new Date().toISOString() } : prev);
          setHasUnsavedChanges(true);
        }
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        if (!canvas || !canRedo()) return;
        const restored = redo(canvas.elements);
        if (restored) {
          setCanvas((prev) => prev ? { ...prev, elements: restored, updatedAt: new Date().toISOString() } : prev);
          setHasUnsavedChanges(true);
        }
        return;
      }

      // Ctrl+D — duplicate selected element
      if (ctrl && e.key === "d") {
        e.preventDefault();
        if (!canvas || !selectedId) return;
        const source = canvas.elements.find((el) => el.id === selectedId);
        if (!source) return;
        pushSnapshot(canvas.elements);
        const duplicate: CanvasElement = {
          ...source,
          id: generateId(),
          data: {
            ...source.data,
            position: {
              ...source.data.position,
              x: source.data.position.x + 20,
              y: source.data.position.y + 20,
            },
          },
        };
        setCanvas((prev) => prev ? { ...prev, elements: [...prev.elements, duplicate], updatedAt: new Date().toISOString() } : prev);
        setSelectedId(duplicate.id);
        setHasUnsavedChanges(true);
        return;
      }

      // Arrow keys — move selected element
      if (selectedId && canvas && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 10;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setCanvas((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === selectedId
                ? { ...el, data: { ...el.data, position: { ...el.data.position, x: el.data.position.x + dx, y: el.data.position.y + dy } } }
                : el
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        setHasUnsavedChanges(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, canvas, canUndo, canRedo]);

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

  // Add an effect to force apply the canvas data when it's available
  useEffect(() => {
    if (canvas?.data && !loading && stageRef.current) {
      // Small delay to ensure the stage is ready
      setTimeout(() => {
        forceApplyData();
      }, 0);
    }
  }, [canvas, loading, stageRef.current]);

  //#endregion EFFECTS

  //#region HANDLERS
  // Save canvas updates to API
  const saveCanvas = async () => {
    if (!canvas) return;

    setIsSaving(true);
    try {
      const currentViewData = getCanvasData();
      const updatedCanvas = {
        ...canvas,
        data: currentViewData,
        updatedAt: new Date().toISOString(),
      };
      await updateCanvas(updatedCanvas);
      setCanvas(updatedCanvas);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error saving canvas:", err);
      setError("Failed to save canvas");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !id) return;

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Step 1: Upload the image to server and get the image key
      const imageId = await uploadImage(selectedFile, id);

      // Step 2: Get the image from the server using the presigned URL
      const imageUrl = await getImage(imageId);
      //const imageUrl = await getImagePresignedUrl(imageId);

      // Step 3: Load the image
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        // Add image to loaded images collection
        setLoadedImages((prev) => ({
          ...prev,
          [imageId]: img,
        }));

        // Step 4: Create element and add image to canvas
        const elementId = generateId();
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
          content: "",
          imageId: imageId,
        };

        // Step 5: Update canvas state with new element
        const updatedCanvas = {
          ...canvas,
          elements: [...canvas.elements, newElement],
          updatedAt: new Date().toISOString(),
        };

        setCanvas(updatedCanvas);

        // Step 6: Save the updated canvas to the server
        try {
          await updateCanvas(updatedCanvas);
          setHasUnsavedChanges(false);
        } catch (err) {
          console.error("Error saving canvas after image upload:", err);
          setHasUnsavedChanges(true);
        }
      };

      img.onerror = (error) => {
        console.error("Error loading image:", error);
        setError("Failed to load uploaded image");
        setHasUnsavedChanges(true);
      };
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
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

      const fontSize = 20;
      const textWidth = Math.max(50, text.length * fontSize * 1.1); // Min width 200px
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

  // Handle element drag start
  const handleElementDragStart = () => {
    isElementDraggingRef.current = true;
  };

  // Handle element drag end
  const handleDragEnd = (e: any, elementId: string) => {
    if (!canvas) return;

    pushSnapshot(canvas.elements);
    isElementDraggingRef.current = false;

    // Get the current node position
    const newX = e.target.x();
    const newY = e.target.y();

    // Update the canvas state with the new element position
    setCanvas((prev) => {
      if (!prev) return prev;

      const updatedElements = prev.elements.map((el) => {
        if (el.id === elementId) {
          // Only update position for this specific element
          return {
            ...el,
            data: {
              ...el.data,
              position: {
                ...el.data.position,
                x: newX,
                y: newY,
              },
            },
          };
        }
        // Keep all other elements unchanged
        return el;
      });

      return {
        ...prev,
        elements: updatedElements,
        updatedAt: new Date().toISOString(),
        // Preserve the current view data
        data: prev.data,
      };
    });

    setHasUnsavedChanges(true);
  };

  // Handle image deletion — server call is immediate; no undo (re-upload would be too complex)
  const handleDeleteImage = async () => {
    if (!canvas || !selectedId) return;

    const selectedElement = canvas.elements.find((el) => el.id === selectedId);
    if (!selectedElement || selectedElement.type !== CanvasElementType.Image) return;

    pushSnapshot(canvas.elements);

    try {
      await deleteImage(selectedElement.imageId);

      setLoadedImages((prev) => {
        const next = { ...prev };
        delete next[selectedElement.imageId];
        return next;
      });

      const updatedCanvas = {
        ...canvas,
        elements: canvas.elements.filter((el) => el.id !== selectedId),
        updatedAt: new Date().toISOString(),
      };
      setCanvas(updatedCanvas);
      setSelectedId(null);
      setHasUnsavedChanges(false);

      setIsSaving(true);
      try {
        await updateCanvas(updatedCanvas);
      } catch {
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }

      toast.success("Image deleted");
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error("Failed to delete image");
    }
  };

  // Handle element deletion — optimistic with undo in toast
  const handleDeleteElement = () => {
    if (!canvas || !selectedId) return;

    const selectedElement = canvas.elements.find((el) => el.id === selectedId);
    if (!selectedElement) return;

    pushSnapshot(canvas.elements);

    const elementsAfterDelete = canvas.elements.filter((el) => el.id !== selectedId);
    setCanvas((prev) => prev ? { ...prev, elements: elementsAfterDelete, updatedAt: new Date().toISOString() } : prev);
    setSelectedId(null);
    setHasUnsavedChanges(true);

    toast("Element deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          setCanvas((prev) => {
            if (!prev) return prev;
            return { ...prev, elements: canvas.elements, updatedAt: new Date().toISOString() };
          });
          setHasUnsavedChanges(true);
        },
      },
    });
  };

  // Handle element transform end (resize/rotate)
  const handleTransformEnd = (e: any, elementId: string) => {
    if (!canvas) return;

    pushSnapshot(canvas.elements);

    // Get the node to access its new properties
    const node = e.target;

    // Get the original element
    const element = canvas.elements.find((el) => el.id === elementId);
    if (!element) return;

    // Calculate new dimensions and rotation, accounting for scale
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

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

    // Reset scale on the node itself, as we've applied it to the width/height
    node.scaleX(1);
    node.scaleY(1);

    // Update canvas with new element properties
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
                x: newX,
                y: newY,
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
      });

      return {
        ...prev,
        elements: updatedElements,
        updatedAt: new Date().toISOString(),
        // Preserve the current view data
        data: prev.data,
      };
    });

    setHasUnsavedChanges(true);

    // No immediate save to server - user will need to click Save button
  };

  // Add a custom wheel handler
  const handleWheelWithForceApply = (e: Konva.KonvaEventObject<WheelEvent>) => {
    // First call the original wheel handler from useGrid
    handleWheel(e);

    // Call the debounced version instead (that preserves position)
    debouncedUpdateCanvasData();
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
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? "Saving…" : hasUnsavedChanges ? "Save*" : "Saved ✓"}
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

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 bg-background/80 p-2 rounded-md">
        <Button onClick={zoomIn} size="sm" variant="outline">
          +
        </Button>
        <Button onClick={resetView} size="sm" variant="outline">
          {Math.round(scale * 100)}%
        </Button>
        <Button onClick={zoomOut} size="sm" variant="outline">
          -
        </Button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Loading canvas...
        </div>
      )}

      {/* Render Stage only when we have canvas data */}
      {canvas && !loading && (
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          draggable={false}
          onClick={(e) => {
            // Deselect when clicking on empty stage
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
          onWheel={handleWheelWithForceApply}
          onMouseDown={(e) => {
            // Enable dragging only when middle mouse button is pressed (button 1)
            // And we're not currently dragging an element
            const stage = e.target.getStage();
            if (
              stage &&
              e.evt.button === 1 &&
              stageRef.current &&
              !isElementDraggingRef.current
            ) {
              stageRef.current.draggable(true);
            }
          }}
          onMouseUp={(e) => {
            // Disable dragging when mouse button is released
            const stage = e.target.getStage();
            if (stage && e.evt.button === 1 && stageRef.current) {
              stageRef.current.draggable(false);
            }
          }}
          onDragEnd={() => {
            // Redraw grid when drag ends
            drawGridLines();
            // Mark canvas as having unsaved changes
            if (!hasUnsavedChanges) {
              setHasUnsavedChanges(true);
            }

            // Disable dragging after drag ends (as an extra safeguard)
            if (stageRef.current) {
              stageRef.current.draggable(false);
            }

            // Use the position-preserving update function
            debouncedUpdateCanvasData();
          }}
          onDragMove={() => {
            // Redraw grid during drag for smoother experience
            drawGridLines();
          }}
          className="bg-black/10"
        >
          {/* Grid Layer */}
          <Layer ref={gridLayerRef} />

          <Layer>
            {canvas?.elements.map((element) => {
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
                    onDragStart={handleElementDragStart}
                    onDragEnd={(e) => handleDragEnd(e, element.id)}
                    onTransformStart={handleElementDragStart}
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
                    onDragStart={handleElementDragStart}
                    onDragEnd={(e) => handleDragEnd(e, element.id)}
                    onTransformStart={handleElementDragStart}
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
      )}
    </div>
  );
  //#endregion RENDERING
};

export default Canvas;
