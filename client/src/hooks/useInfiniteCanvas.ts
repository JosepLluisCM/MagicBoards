import { useRef, useEffect, useState, RefObject } from "react";
import Konva from "konva";

interface InfiniteCanvasOptions {
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  initialScale?: number;
  initialPosition?: { x: number; y: number };
  onScaleChange?: (scale: number) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

interface InfiniteCanvasResult {
  stageRef: RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setZoom: (scale: number) => void;
}

/**
 * Custom hook for implementing infinite canvas with zoom and pan functionality
 */
export const useInfiniteCanvas = ({
  minScale = 0.05,
  maxScale = 6,
  scaleStep = 1.05,
  initialScale = 1,
  initialPosition = { x: 0, y: 0 },
  onScaleChange,
  onPositionChange,
}: InfiniteCanvasOptions = {}): InfiniteCanvasResult => {
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);

  // Initialize the stage with draggable properties
  useEffect(() => {
    if (!stageRef.current) return;

    // Make stage draggable for panning
    stageRef.current.draggable(true);

    // Set initial scale and position
    stageRef.current.scale({ x: initialScale, y: initialScale });
    stageRef.current.position(initialPosition);
  }, [initialScale, initialPosition]);

  // Handle wheel events for zooming
  useEffect(() => {
    if (!stageRef.current) return;

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Current scale and pointer position
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      // Calculate mouse point relative to stage
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Determine zoom direction
      let direction = e.evt.deltaY > 0 ? -1 : 1;

      // Reverse direction for ctrl key (trackpad pinch)
      if (e.evt.ctrlKey) {
        direction = -direction;
      }

      // Calculate new scale with limits
      let newScale =
        direction > 0
          ? Math.min(oldScale * scaleStep, maxScale)
          : Math.max(oldScale / scaleStep, minScale);

      // Apply new scale
      stage.scale({ x: newScale, y: newScale });

      // Calculate new position to zoom to mouse pointer
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      // Apply new position
      stage.position(newPos);

      // Update state
      setScale(newScale);
      setPosition(newPos);

      // Trigger callbacks
      if (onScaleChange) onScaleChange(newScale);
      if (onPositionChange) onPositionChange(newPos);
    };

    // Handle stage drag
    const handleDragEnd = () => {
      if (!stageRef.current) return;

      const newPos = stageRef.current.position();
      setPosition(newPos);

      if (onPositionChange) onPositionChange(newPos);
    };

    // Add event listeners
    const stage = stageRef.current;
    stage.on("wheel", handleWheel);
    stage.on("dragend", handleDragEnd);

    // Cleanup
    return () => {
      stage.off("wheel", handleWheel);
      stage.off("dragend", handleDragEnd);
    };
  }, [minScale, maxScale, scaleStep, onScaleChange, onPositionChange]);

  // Methods to control the canvas externally
  const zoomIn = () => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleStep, maxScale);

    // Calculate center of stage
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;

    // Get current position
    const oldPos = stage.position();

    // Calculate new position (zoom to center)
    const newPos = {
      x: centerX - (centerX - oldPos.x) * (newScale / oldScale),
      y: centerY - (centerY - oldPos.y) * (newScale / oldScale),
    };

    // Apply new scale and position
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    // Update state
    setScale(newScale);
    setPosition(newPos);

    // Trigger callbacks
    if (onScaleChange) onScaleChange(newScale);
    if (onPositionChange) onPositionChange(newPos);
  };

  const zoomOut = () => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / scaleStep, minScale);

    // Calculate center of stage
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;

    // Get current position
    const oldPos = stage.position();

    // Calculate new position (zoom to center)
    const newPos = {
      x: centerX - (centerX - oldPos.x) * (newScale / oldScale),
      y: centerY - (centerY - oldPos.y) * (newScale / oldScale),
    };

    // Apply new scale and position
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    // Update state
    setScale(newScale);
    setPosition(newPos);

    // Trigger callbacks
    if (onScaleChange) onScaleChange(newScale);
    if (onPositionChange) onPositionChange(newPos);
  };

  const resetView = () => {
    if (!stageRef.current) return;

    // Reset to initial values
    stageRef.current.scale({ x: initialScale, y: initialScale });
    stageRef.current.position(initialPosition);

    // Update state
    setScale(initialScale);
    setPosition(initialPosition);

    // Trigger callbacks
    if (onScaleChange) onScaleChange(initialScale);
    if (onPositionChange) onPositionChange(initialPosition);
  };

  const setZoom = (newScale: number) => {
    if (!stageRef.current) return;

    // Clamp scale to limits
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

    // Apply new scale
    stageRef.current.scale({ x: clampedScale, y: clampedScale });

    // Update state
    setScale(clampedScale);

    // Trigger callback
    if (onScaleChange) onScaleChange(clampedScale);
  };

  return {
    stageRef,
    scale,
    position,
    zoomIn,
    zoomOut,
    resetView,
    setZoom,
  };
};

export default useInfiniteCanvas;
