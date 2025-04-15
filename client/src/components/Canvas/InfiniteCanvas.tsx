// import { ReactNode, useEffect, useState } from "react";
// import { Stage, Layer } from "react-konva";
// import { Button } from "../ui/button";
// import useInfiniteCanvas from "@/hooks/useInfiniteCanvas";
// import GridLayer from "./GridLayer";

// interface InfiniteCanvasProps {
//   children?: ReactNode;
//   width?: number;
//   height?: number;
//   gridStep?: number;
//   gridColor?: string;
//   gridOpacity?: number;
//   showControls?: boolean;
//   showGridBorder?: boolean;
//   initialScale?: number;
//   initialPosition?: { x: number; y: number };
//   minScale?: number;
//   maxScale?: number;
//   onScaleChange?: (scale: number) => void;
//   onPositionChange?: (position: { x: number; y: number }) => void;
// }

// /**
//  * InfiniteCanvas component - provides an infinite canvas with grid background and zoom/pan controls
//  */
// const InfiniteCanvas = ({
//   children,
//   width = window.innerWidth,
//   height = window.innerHeight,
//   gridStep = 40,
//   gridColor = "rgba(0, 0, 0, 0.2)",
//   gridOpacity = 0.2,
//   showControls = true,
//   showGridBorder = false,
//   initialScale = 1,
//   initialPosition = { x: 0, y: 0 },
//   minScale = 0.05,
//   maxScale = 6,
//   onScaleChange,
//   onPositionChange,
// }: InfiniteCanvasProps) => {
//   // Use our custom hook for canvas management
//   const { stageRef, scale, zoomIn, zoomOut, resetView } = useInfiniteCanvas({
//     minScale,
//     maxScale,
//     initialScale,
//     initialPosition,
//     onScaleChange,
//     onPositionChange,
//   });

//   // State for canvas dimensions
//   const [dimensions, setDimensions] = useState({
//     width,
//     height,
//   });

//   // Handle window resize
//   useEffect(() => {
//     const handleResize = () => {
//       setDimensions({
//         width: window.innerWidth,
//         height: window.innerHeight,
//       });
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   return (
//     <div className="relative w-full h-full overflow-hidden">
//       {/* Zoom controls */}
//       {showControls && (
//         <div className="absolute bottom-4 right-4 flex gap-2 z-10 bg-background/80 p-2 rounded-md">
//           <Button onClick={zoomIn} size="sm" variant="outline">
//             +
//           </Button>
//           <Button onClick={resetView} size="sm" variant="outline">
//             {Math.round(scale * 100)}%
//           </Button>
//           <Button onClick={zoomOut} size="sm" variant="outline">
//             -
//           </Button>
//         </div>
//       )}

//       {/* Canvas Stage */}
//       <Stage
//         ref={stageRef}
//         width={dimensions.width}
//         height={dimensions.height}
//         className="bg-black/10"
//       >
//         {/* Grid Layer */}
//         <GridLayer
//           stageRef={stageRef}
//           stepSize={gridStep}
//           gridColor={gridColor}
//           gridOpacity={gridOpacity}
//           showBorder={showGridBorder}
//         />

//         {/* Content Layer */}
//         <Layer>{children}</Layer>
//       </Stage>
//     </div>
//   );
// };

// export default InfiniteCanvas;
