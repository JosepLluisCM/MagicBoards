import { useRef, useState, useEffect } from "react";
import Konva from "konva";
import { CanvasData } from "@/types/canvas";

interface UseGridOptions {
  stepSize?: number;
  gridColor?: string;
  gridOpacity?: number;
  showBorder?: boolean;
  borderColor?: string;
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  initialCanvasData?: CanvasData;
  onViewChange?: () => void; // Callback for when position or scale changes
}

/**
 * Hook for managing infinite canvas with grid background
 */
const useGrid = ({
  stepSize = 40,
  gridColor = "rgba(255, 255, 255, 0.2)",
  gridOpacity = 0.2,
  showBorder = false,
  borderColor = "red",
  minScale = 0.1,
  maxScale = 5,
  scaleStep = 1.1,
  initialCanvasData,
  onViewChange,
}: UseGridOptions = {}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const gridLayerRef = useRef<Konva.Layer>(null);

  // Set initial scale and position from CanvasData or use defaults
  const [scale, setScale] = useState(initialCanvasData?.scale || 1);
  const initialPosition = initialCanvasData?.position
    ? { x: initialCanvasData.position.x, y: initialCanvasData.position.y }
    : { x: 0, y: 0 };
  const [position, setPosition] = useState(initialPosition);

  // Function to update state and notify of changes
  const updateView = (
    newScale: number,
    newPosition: { x: number; y: number }
  ) => {
    setScale(newScale);
    setPosition(newPosition);

    // Notify parent component of changes if callback provided
    if (onViewChange) {
      onViewChange();
    }
  };

  // Function to handle unscaling (converting from scaled to unscaled coordinates)
  const unScale = (val: number): number => {
    if (!stageRef.current) return val;
    return val / stageRef.current.scaleX();
  };

  // Function to draw grid lines
  const drawGridLines = () => {
    if (!stageRef.current || !gridLayerRef.current) return;

    const stage = stageRef.current;
    const gridLayer = gridLayerRef.current;

    // Clear previous grid lines
    gridLayer.clear();
    gridLayer.destroyChildren();
    gridLayer.clipWidth(null); // clear any clipping

    // Get stage dimensions
    const width = stage.width();
    const height = stage.height();

    // Calculate view rectangles
    const stageRect = {
      x1: 0,
      y1: 0,
      x2: stage.width(),
      y2: stage.height(),
      offset: {
        x: unScale(stage.position().x),
        y: unScale(stage.position().y),
      },
    };

    const viewRect = {
      x1: -stageRect.offset.x,
      y1: -stageRect.offset.y,
      x2: unScale(width) - stageRect.offset.x,
      y2: unScale(height) - stageRect.offset.y,
    };

    // // Calculate full rectangle (bounds both stage and view)
    // const fullRect = {
    //   x1: Math.min(stageRect.x1, viewRect.x1),
    //   y1: Math.min(stageRect.y1, viewRect.y1),
    //   x2: Math.max(stageRect.x2, viewRect.x2),
    //   y2: Math.max(stageRect.y2, viewRect.y2),
    // };

    // Calculate grid offset to align with step size
    const gridOffset = {
      x: Math.ceil(unScale(stage.position().x) / stepSize) * stepSize,
      y: Math.ceil(unScale(stage.position().y) / stepSize) * stepSize,
    };

    // Calculate grid rectangle
    const gridRect = {
      x1: -gridOffset.x,
      y1: -gridOffset.y,
      x2: unScale(width) - gridOffset.x + stepSize,
      y2: unScale(height) - gridOffset.y + stepSize,
    };

    // Calculate full grid rectangle
    const gridFullRect = {
      x1: Math.min(stageRect.x1, gridRect.x1),
      y1: Math.min(stageRect.y1, gridRect.y1),
      x2: Math.max(stageRect.x2, gridRect.x2),
      y2: Math.max(stageRect.y2, gridRect.y2),
    };

    // Set clipping area to prevent drawing outside viewport
    gridLayer.clip({
      x: viewRect.x1,
      y: viewRect.y1,
      width: viewRect.x2 - viewRect.x1,
      height: viewRect.y2 - viewRect.y1,
    });

    // Use gridFullRect for drawing
    const fullRect2 = gridFullRect;

    // Calculate grid sizes
    const xSize = fullRect2.x2 - fullRect2.x1;
    const ySize = fullRect2.y2 - fullRect2.y1;

    // Calculate number of steps
    const xSteps = Math.round(xSize / stepSize);
    const ySteps = Math.round(ySize / stepSize);

    // Draw vertical lines
    for (let i = 0; i <= xSteps; i++) {
      gridLayer.add(
        new Konva.Line({
          x: fullRect2.x1 + i * stepSize,
          y: fullRect2.y1,
          points: [0, 0, 0, ySize],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
        })
      );
    }

    // Draw horizontal lines
    for (let i = 0; i <= ySteps; i++) {
      gridLayer.add(
        new Konva.Line({
          x: fullRect2.x1,
          y: fullRect2.y1 + i * stepSize,
          points: [0, 0, xSize, 0],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
        })
      );
    }

    // Optionally draw a border around the viewport for debugging
    if (showBorder) {
      gridLayer.add(
        new Konva.Rect({
          x: viewRect.x1 + 2,
          y: viewRect.y1 + 2,
          width: viewRect.x2 - viewRect.x1 - 4,
          height: viewRect.y2 - viewRect.y1 - 4,
          strokeWidth: 4,
          stroke: borderColor,
        })
      );
    }

    gridLayer.batchDraw();
  };

  // Zoom functions
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

    // Update state and notify of changes
    updateView(newScale, newPos);

    // Redraw grid
    drawGridLines();
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

    // Update state and notify of changes
    updateView(newScale, newPos);

    // Redraw grid
    drawGridLines();
  };

  const resetView = () => {
    if (!stageRef.current) return;

    // Reset to initial values
    stageRef.current.scale({ x: 1, y: 1 });
    stageRef.current.position({ x: 0, y: 0 });

    // Update state and notify of changes
    updateView(1, { x: 0, y: 0 });

    // Redraw grid
    drawGridLines();
  };

  // Handle wheel events for zooming
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

    // Update state and notify of changes
    updateView(newScale, newPos);

    // Redraw grid
    drawGridLines();
  };

  // Initialize grid drawing and stage properties
  useEffect(() => {
    if (!stageRef.current || !gridLayerRef.current) return;

    // Make stage draggable for panning
    stageRef.current.draggable(true);

    // Set initial scale and position from CanvasData if available
    if (initialCanvasData) {
      stageRef.current.scale({
        x: initialCanvasData.scale,
        y: initialCanvasData.scale,
      });

      stageRef.current.position({
        x: initialCanvasData.position.x,
        y: initialCanvasData.position.y,
      });
    }

    // Initial draw of grid
    drawGridLines();

    // Add event listeners to stage
    const stage = stageRef.current;

    // Handle stage drag end
    const handleDragEnd = () => {
      if (!stage) return;
      const newPos = stage.position();

      // Update state and notify of changes
      updateView(stage.scaleX(), newPos);

      drawGridLines();
    };

    // Handle stage drag move for smoother experience
    const handleDragMove = () => {
      if (!stage) return;
      // We don't update state during drag move to avoid excessive renders
      // But we do redraw the grid for a smoother experience
      drawGridLines();
    };

    // Add event listeners
    stage.on("dragend", handleDragEnd);
    stage.on("dragmove", handleDragMove);

    // Remove event listeners on cleanup
    return () => {
      stage.off("dragend", handleDragEnd);
      stage.off("dragmove", handleDragMove);
    };
  }, [stageRef.current, gridLayerRef.current, initialCanvasData]);

  // Get current canvas data for saving
  const getCanvasData = (): CanvasData => {
    if (!stageRef.current) {
      return {
        scale: scale,
        position: position,
      };
    }

    return {
      scale: stageRef.current.scaleX(),
      position: {
        x: stageRef.current.x(),
        y: stageRef.current.y(),
      },
    };
  };

  return {
    stageRef,
    gridLayerRef,
    scale,
    position,
    zoomIn,
    zoomOut,
    resetView,
    handleWheel,
    drawGridLines,
    getCanvasData,
  };
};

export default useGrid;
