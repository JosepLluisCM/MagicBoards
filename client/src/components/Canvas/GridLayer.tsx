// import { useEffect, useRef } from "react";
// import { Layer, Line, Rect } from "react-konva";
// import Konva from "konva";

// interface GridLayerProps {
//   stageRef: React.RefObject<Konva.Stage | null>;
//   stepSize?: number;
//   gridColor?: string;
//   gridOpacity?: number;
//   showBorder?: boolean;
//   borderColor?: string;
// }

// /**
//  * Grid layer component for canvas.
//  * Renders an infinite grid background that pans with the stage.
//  */
// const GridLayer = ({
//   stageRef,
//   stepSize = 40,
//   gridColor = "rgba(0, 0, 0, 0.2)",
//   gridOpacity = 0.2,
//   showBorder = false,
//   borderColor = "red",
// }: GridLayerProps) => {
//   const layerRef = useRef<Konva.Layer>(null);

//   // Function to handle unscaling (converting from scaled to unscaled coordinates)
//   const unScale = (val: number): number => {
//     if (!stageRef.current) return val;
//     return val / stageRef.current.scaleX();
//   };

//   // Function to draw grid lines
//   const drawGridLines = () => {
//     if (!stageRef.current || !layerRef.current) return;

//     const stage = stageRef.current;
//     const gridLayer = layerRef.current;

//     // Clear previous grid lines
//     gridLayer.clear();
//     gridLayer.destroyChildren();
//     gridLayer.clipWidth(null); // clear any clipping

//     // Get stage dimensions
//     const width = stage.width();
//     const height = stage.height();

//     // Calculate view rectangles
//     const stageRect = {
//       x1: 0,
//       y1: 0,
//       x2: stage.width(),
//       y2: stage.height(),
//       offset: {
//         x: unScale(stage.position().x),
//         y: unScale(stage.position().y),
//       },
//     };

//     const viewRect = {
//       x1: -stageRect.offset.x,
//       y1: -stageRect.offset.y,
//       x2: unScale(width) - stageRect.offset.x,
//       y2: unScale(height) - stageRect.offset.y,
//     };

//     // Calculate full rectangle (bounds both stage and view)
//     const fullRect = {
//       x1: Math.min(stageRect.x1, viewRect.x1),
//       y1: Math.min(stageRect.y1, viewRect.y1),
//       x2: Math.max(stageRect.x2, viewRect.x2),
//       y2: Math.max(stageRect.y2, viewRect.y2),
//     };

//     // Calculate grid offset to align with step size
//     const gridOffset = {
//       x: Math.ceil(unScale(stage.position().x) / stepSize) * stepSize,
//       y: Math.ceil(unScale(stage.position().y) / stepSize) * stepSize,
//     };

//     // Calculate grid rectangle
//     const gridRect = {
//       x1: -gridOffset.x,
//       y1: -gridOffset.y,
//       x2: unScale(width) - gridOffset.x + stepSize,
//       y2: unScale(height) - gridOffset.y + stepSize,
//     };

//     // Calculate full grid rectangle
//     const gridFullRect = {
//       x1: Math.min(stageRect.x1, gridRect.x1),
//       y1: Math.min(stageRect.y1, gridRect.y1),
//       x2: Math.max(stageRect.x2, gridRect.x2),
//       y2: Math.max(stageRect.y2, gridRect.y2),
//     };

//     // Set clipping area to prevent drawing outside viewport
//     gridLayer.clip({
//       x: viewRect.x1,
//       y: viewRect.y1,
//       width: viewRect.x2 - viewRect.x1,
//       height: viewRect.y2 - viewRect.y1,
//     });

//     // Use gridFullRect for drawing
//     const fullRect2 = gridFullRect;

//     // Calculate grid sizes
//     const xSize = fullRect2.x2 - fullRect2.x1;
//     const ySize = fullRect2.y2 - fullRect2.y1;

//     // Calculate number of steps
//     const xSteps = Math.round(xSize / stepSize);
//     const ySteps = Math.round(ySize / stepSize);

//     // Draw vertical lines
//     for (let i = 0; i <= xSteps; i++) {
//       gridLayer.add(
//         new Konva.Line({
//           x: fullRect2.x1 + i * stepSize,
//           y: fullRect2.y1,
//           points: [0, 0, 0, ySize],
//           stroke: gridColor,
//           strokeWidth: 1,
//           opacity: gridOpacity,
//         })
//       );
//     }

//     // Draw horizontal lines
//     for (let i = 0; i <= ySteps; i++) {
//       gridLayer.add(
//         new Konva.Line({
//           x: fullRect2.x1,
//           y: fullRect2.y1 + i * stepSize,
//           points: [0, 0, xSize, 0],
//           stroke: gridColor,
//           strokeWidth: 1,
//           opacity: gridOpacity,
//         })
//       );
//     }

//     // Optionally draw a border around the viewport for debugging
//     if (showBorder) {
//       gridLayer.add(
//         new Konva.Rect({
//           x: viewRect.x1 + 2,
//           y: viewRect.y1 + 2,
//           width: viewRect.x2 - viewRect.x1 - 4,
//           height: viewRect.y2 - viewRect.y1 - 4,
//           strokeWidth: 4,
//           stroke: borderColor,
//         })
//       );
//     }

//     gridLayer.batchDraw();
//   };

//   // Redraw grid when stage changes
//   useEffect(() => {
//     if (!stageRef.current || !layerRef.current) return;

//     // Initial draw
//     drawGridLines();

//     // Add event listeners to stage
//     const stage = stageRef.current;

//     // Handle stage drag end
//     const handleDragEnd = () => {
//       drawGridLines();
//     };

//     // Handle stage drag move for smoother experience
//     const handleDragMove = () => {
//       drawGridLines();
//     };

//     // Handle stage scale change
//     const handleWheel = () => {
//       drawGridLines();
//     };

//     // Add event listeners
//     stage.on("dragend", handleDragEnd);
//     stage.on("dragmove", handleDragMove);
//     stage.on("wheel", handleWheel);

//     // Remove event listeners on cleanup
//     return () => {
//       stage.off("dragend", handleDragEnd);
//       stage.off("dragmove", handleDragMove);
//       stage.off("wheel", handleWheel);
//     };
//   }, [
//     stageRef.current,
//     layerRef.current,
//     stepSize,
//     gridColor,
//     gridOpacity,
//     showBorder,
//     borderColor,
//   ]);

//   return <Layer ref={layerRef} />;
// };

// export default GridLayer;
