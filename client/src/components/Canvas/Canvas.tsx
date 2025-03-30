import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { useCanvasData } from "./hooks/useCanvasData";
import { useImages } from "./hooks/useImages";
import { useElementSelection } from "./hooks/useElementSelection";
import { useStageInteraction } from "./hooks/useStageInteraction";

const Canvas = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hooks
  const {
    canvasData,
    setCanvasData,
    isSaving,
    stagePosition,
    setStagePosition,
    saveCanvas,
  } = useCanvasData(id);

  const { images, handleFileUpload } = useImages(
    canvasData,
    setCanvasData as any
  );

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
  } = useElementSelection(canvasData, setCanvasData as any);

  const {
    stageRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResetView,
  } = useStageInteraction(stagePosition);

  // Update stageRef in useStageInteraction when it changes
  useEffect(() => {
    setStagePosition(stagePosition);
  }, [stagePosition, setStagePosition]);

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
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
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
            if (element.type === "image" && element.id && images[element.id]) {
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
                  onClick={() => handleSelectElement(element.id!)}
                  onTap={() => handleSelectElement(element.id!)}
                  onDragStart={() => handleDragStart(element.id!)}
                  onDragEnd={(e) => {
                    handleDragEnd(element.id!, e.target.x(), e.target.y());
                  }}
                  onTransformEnd={() => handleTransformEnd(element.id!)}
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
    </div>
  );
};

export default Canvas;
