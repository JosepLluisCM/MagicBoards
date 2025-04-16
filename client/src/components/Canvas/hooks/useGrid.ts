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
  const isInitializedRef = useRef(false);
  const dataAppliedRef = useRef(false);
  const initialDataAppliedRef = useRef(false);

  // Set initial scale and position - don't use defaults, wait for data
  const [scale, setScale] = useState<number | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

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

  // Effect to update state when initialCanvasData changes
  useEffect(() => {
    if (initialCanvasData) {
      // Use exact scale from database
      const canvasScale =
        typeof initialCanvasData.scale === "number" &&
        initialCanvasData.scale > 0
          ? initialCanvasData.scale
          : 1;

      // Ensure position values are numbers
      const canvasX = Number(initialCanvasData.position.x || 0);
      const canvasY = Number(initialCanvasData.position.y || 0);

      console.log(
        `Setting initial canvas data: scale=${canvasScale}, x=${canvasX}, y=${canvasY}`
      );

      setScale(canvasScale);
      setPosition({
        x: canvasX,
        y: canvasY,
      });
    }
  }, [initialCanvasData]);

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

    // Set clipping area to prevent drawing outside viewport (Solution 4)
    gridLayer.clip({
      x: viewRect.x1,
      y: viewRect.y1,
      width: viewRect.x2 - viewRect.x1,
      height: viewRect.y2 - viewRect.y1,
    });

    // Use gridFullRect for drawing (Solution 4)
    const fullRect = gridFullRect;

    // Calculate grid sizes
    const xSize = fullRect.x2 - fullRect.x1;
    const ySize = fullRect.y2 - fullRect.y1;

    // Calculate number of steps
    const xSteps = Math.round(xSize / stepSize);
    const ySteps = Math.round(ySize / stepSize);

    // Draw vertical lines
    for (let i = 0; i <= xSteps; i++) {
      gridLayer.add(
        new Konva.Line({
          x: fullRect.x1 + i * stepSize,
          y: fullRect.y1,
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
          x: fullRect.x1,
          y: fullRect.y1 + i * stepSize,
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

  // Add a sync function to ensure scale state stays up to date with the stage
  const syncStateWithStage = () => {
    if (!stageRef.current) return;

    const currentScale = stageRef.current.scaleX();
    const currentPosition = {
      x: stageRef.current.x(),
      y: stageRef.current.y(),
    };

    // Only update if values actually changed
    if (
      scale !== currentScale ||
      !position ||
      position.x !== currentPosition.x ||
      position.y !== currentPosition.y
    ) {
      setScale(currentScale);
      setPosition(currentPosition);
    }
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
        ? validateZoomScale(oldScale * scaleStep)
        : validateZoomScale(oldScale / scaleStep);

    // Calculate new position to zoom to mouse pointer
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // Apply new scale and position
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);

    // Update state and notify of changes
    updateView(newScale, newPos);

    // Redraw grid
    drawGridLines();
  };

  // Effect to sync with stage on window focus
  useEffect(() => {
    const handleFocus = () => {
      syncStateWithStage();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Initialize grid drawing and stage properties
  useEffect(() => {
    if (!stageRef.current || !gridLayerRef.current) return;
    if (!initialCanvasData) return; // Wait for data

    // Get valid position and scale values
    const canvasScale =
      typeof initialCanvasData.scale === "number" && initialCanvasData.scale > 0
        ? initialCanvasData.scale
        : 1;
    const canvasX = Number(initialCanvasData.position.x || 0);
    const canvasY = Number(initialCanvasData.position.y || 0);

    console.log(
      `Applying canvas data to stage: scale=${canvasScale}, x=${canvasX}, y=${canvasY}`
    );

    // Stop here if we've already applied initial data
    if (initialDataAppliedRef.current) {
      console.log("Initial data already applied, skipping");
      return;
    }

    // Apply scale and position to stage
    stageRef.current.scale({
      x: canvasScale,
      y: canvasScale,
    });

    stageRef.current.position({
      x: canvasX,
      y: canvasY,
    });

    // Make stage draggable for panning (only need to do this once)
    if (!isInitializedRef.current) {
      stageRef.current.draggable(true);
      isInitializedRef.current = true;

      // Add event listeners to stage (only do this once)
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
      const removeListeners = () => {
        if (stage) {
          stage.off("dragend", handleDragEnd);
          stage.off("dragmove", handleDragMove);
        }
      };

      // Return cleanup function
      if (typeof window !== "undefined") {
        // Cleanup when component unmounts
        window.addEventListener("beforeunload", removeListeners);
        return () => {
          window.removeEventListener("beforeunload", removeListeners);
          removeListeners();
        };
      }
    }

    dataAppliedRef.current = true;
    initialDataAppliedRef.current = true;

    // Make sure the state matches what we just set on the stage
    setScale(canvasScale);
    setPosition({
      x: canvasX,
      y: canvasY,
    });

    // Draw grid with small delay to ensure stage is ready
    setTimeout(() => {
      drawGridLines();
    }, 0);

    // Force an additional redraw on the next frame to ensure grid is visible
    requestAnimationFrame(() => {
      drawGridLines();
    });

    // Sometimes it takes a moment for the stage to be fully sized
    // Use a short delay to ensure grid is properly drawn
    setTimeout(() => {
      drawGridLines();
    }, 200);
  }, [initialCanvasData, stageRef.current, gridLayerRef.current]);

  // Add a general effect to draw grid when component mounts
  useEffect(() => {
    // Only draw grid if stage and layer are ready AND data has been applied
    if (stageRef.current && gridLayerRef.current && dataAppliedRef.current) {
      console.log("Drawing grid after initialization");
      // Initial draw might need multiple attempts
      drawGridLines();

      // Redraw after a small delay to ensure proper sizing
      const timer = setTimeout(() => {
        drawGridLines();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [dataAppliedRef.current]);

  // Export this for debugging
  const forceApplyData = () => {
    if (!stageRef.current || !initialCanvasData) return;

    const canvasScale =
      typeof initialCanvasData.scale === "number" && initialCanvasData.scale > 0
        ? initialCanvasData.scale
        : 1;
    const canvasX = Number(initialCanvasData.position.x || 0);
    const canvasY = Number(initialCanvasData.position.y || 0);

    console.log(
      `Force applying canvas data: scale=${canvasScale}, x=${canvasX}, y=${canvasY}`
    );

    stageRef.current.scale({ x: canvasScale, y: canvasScale });
    stageRef.current.position({ x: canvasX, y: canvasY });

    drawGridLines();
  };

  // Get current canvas data for saving
  const getCanvasData = (): CanvasData => {
    if (!stageRef.current) {
      return {
        scale: scale || 1,
        position: position || { x: 0, y: 0 },
      };
    }

    // Sync state with stage before returning
    syncStateWithStage();

    return {
      scale: stageRef.current.scaleX(),
      position: {
        x: stageRef.current.x(),
        y: stageRef.current.y(),
      },
    };
  };

  // Function to validate zoom scale (only for user-initiated zooms)
  const validateZoomScale = (desiredScale: number): number => {
    return Math.min(Math.max(desiredScale, minScale), maxScale);
  };

  return {
    stageRef,
    gridLayerRef,
    scale: scale || 1, // Always return a valid scale for UI
    position: position || { x: 0, y: 0 },
    zoomIn: () => {
      if (!stageRef.current) return;
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      // Apply limits only on zooming, not on initial load
      const newScale = validateZoomScale(oldScale * scaleStep);

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
    },
    zoomOut: () => {
      if (!stageRef.current) return;
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      // Apply limits only on zooming, not on initial load
      const newScale = validateZoomScale(oldScale / scaleStep);

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
    },
    resetView,
    handleWheel,
    drawGridLines,
    getCanvasData,
    forceApplyData,
  };
};

export default useGrid;
