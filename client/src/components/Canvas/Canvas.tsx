import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { useImages } from "./hooks/useImages";
import { useElementSelection } from "./hooks/useElementSelection";
import { useStageInteraction } from "./hooks/useStageInteraction";
import { CanvasElement, CanvasElementType } from "@/types/canvas";
import type { Canvas } from "@/types/canvas";
import { getCanvas, updateCanvas } from "@/api/services/CanvasService";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/loading-spinner";

const Canvas = () => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load canvas data when component mounts
  useEffect(() => {
    const fetchCanvasData = async () => {
      setIsLoading(true);
      try {
        if (!id) throw new Error("Canvas ID is required");

        const canvasFromApi = await getCanvas(id);
        setCanvas(canvasFromApi);
      } catch (error) {
        console.error("Error fetching canvas data:", error);
        toast.error("Error loading canvas", {
          description: "Could not load canvas data from the server.",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvasData();
  }, [id]);

  const saveCanvas = async () => {
    setIsSavingCanvas(true);
    try {
      if (!canvas) {
        throw new Error("No canvas data to save");
      }
      await updateCanvas(canvas);
      toast.success("Canvas saved successfully");
    } catch (error) {
      console.error("Error saving canvas:", error);
      toast.error("Error saving canvas");
    } finally {
      setIsSavingCanvas(false);
    }
  };

  const { images, handleFileUpload } = useImages(canvas, setCanvas);

  const {
    selectedId,
    isCtrlPressed,
    transformerRef,
    handleDragStart,
    handleDragEnd,
    handleTransformEnd,
    handleSelectElement,
    handleDeleteSelected,
    checkDeselect,
  } = useElementSelection(canvas, setCanvas);

  const {
    stageRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResetView,
  } = useStageInteraction(canvas?.data);

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
    if (!files || !files.length || !canvas) return;

    await handleFileUpload(files[0], dimensions);

    // Reset the file input so the same file can be selected again
    e.target.value = "";
  };

  // React event handlers for the container
  const handleBoxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Forward keyboard events to the global event handlers in useElementSelection
    const event = e.nativeEvent as unknown as KeyboardEvent;
    if (
      event.key === "Control" ||
      event.key === "Meta" ||
      event.key === "Delete"
    ) {
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new KeyboardEvent("keydown", event));
      }
    }
  };

  const handleBoxKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Forward keyboard events to the global event handlers in useElementSelection
    const event = e.nativeEvent as unknown as KeyboardEvent;
    if (event.key === "Control" || event.key === "Meta") {
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new KeyboardEvent("keyup", event));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center w-full py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      tabIndex={0}
      onKeyDown={handleBoxKeyDown}
      onKeyUp={handleBoxKeyUp}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button
          onClick={() => navigate("/canvas-selection")}
          size="sm"
          variant="default"
        >
          Back to Selection
        </Button>
        <Button onClick={handleAddImageClick} size="sm" variant="default">
          Add Image
        </Button>
        <Button onClick={handleDeleteSelected} size="sm" variant="destructive">
          Delete Selected
        </Button>
        <Button onClick={handleResetView} size="sm" variant="secondary">
          Reset View
        </Button>
        <Button
          onClick={saveCanvas}
          size="sm"
          variant="outline"
          disabled={isSavingCanvas}
        >
          {isSavingCanvas ? "Saving..." : "Save"}
        </Button>
      </div>

      {isCtrlPressed && selectedId && (
        <div className="absolute top-14 left-4 bg-black text-white p-2 rounded-md text-sm z-10">
          Free Resize Mode
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {canvas && (
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          ref={stageRef}
          x={canvas.data.position.x}
          y={canvas.data.position.y}
          scaleX={canvas.data.scale}
          scaleY={canvas.data.scale}
          onClick={checkDeselect}
        >
          <Layer>
            {canvas.elements.map((element: CanvasElement) => {
              if (
                element.type === CanvasElementType.Image &&
                element.id &&
                images[element.id]
              ) {
                return (
                  <KonvaImage
                    key={element.id}
                    id={element.id}
                    image={images[element.id]}
                    x={element.data.position.x}
                    y={element.data.position.y}
                    width={element.data.size.width}
                    height={element.data.size.height}
                    rotation={element.data.rotation}
                    //draggable
                    //onClick={() => handleSelectElement(element.id!)}
                    //onTap={() => handleSelectElement(element.id!)}
                    //onDragStart={() => handleDragStart(element.id!)}
                    //onDragEnd={(e) => {
                    //  handleDragEnd(element.id!, e.target.x(), e.target.y());
                    //}}
                    //onTransformEnd={() => handleTransformEnd(element.id!)}
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
      )}
    </div>
  );
};

export default Canvas;
