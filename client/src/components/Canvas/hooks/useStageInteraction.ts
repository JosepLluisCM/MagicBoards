import { useState, useEffect, useRef } from "react";
import Konva from "konva";
import { CanvasData, CanvasPosition } from "../../../types/canvas";

// Define StagePosition interface directly since we're not using index.ts
interface StagePosition {
  x: number;
  y: number;
  scale: number;
}

export const useStageInteraction = (
  initialPosition: CanvasData = {
    position: { x: 0, y: 0 },
    scale: 1,
  }
) => {
  const [stagePosition, setStagePosition] =
    useState<CanvasData>(initialPosition);
  const [isPanning, setIsPanning] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
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
      x: (mouseX - stagePosition.position.x) / oldScale,
      y: (mouseY - stagePosition.position.y) / oldScale,
    };

    const newPos = {
      x: mouseX - mousePointTo.x * limitedScale,
      y: mouseY - mousePointTo.y * limitedScale,
    };

    setStagePosition({
      position: {
        x: newPos.x,
        y: newPos.y,
      },
      scale: limitedScale,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Middle mouse button (button 1)
    if (e.button === 1) {
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.preventDefault();

      setStagePosition({
        ...stagePosition,
        position: {
          x: stagePosition.position.x + e.movementX,
          y: stagePosition.position.y + e.movementY,
        },
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      setIsPanning(false);
    }
  };

  const handleResetView = () => {
    setStagePosition({
      position: { x: 0, y: 0 },
      scale: 1,
    });
  };

  // Handle pointer position in the stage
  const getRelativePointerPosition = (
    clientX: number,
    clientY: number,
    containerRect: DOMRect
  ) => {
    const stage = stageRef.current;
    if (!stage) return null;

    // Calculate position relative to container
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;

    // Apply stage transform to get coordinates in stage space
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point({ x, y });
  };

  return {
    stageRef,
    stagePosition,
    setStagePosition,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResetView,
    getRelativePointerPosition,
  };
};
