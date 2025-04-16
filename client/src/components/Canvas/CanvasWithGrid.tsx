// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Button } from "../ui/button";
// import { getCanvas } from "@/api/services/CanvasService";
// import { Canvas as CanvasType } from "@/types/canvas";
// import InfiniteCanvas from "./InfiniteCanvas";
// import { Image as KonvaImage, Text } from "react-konva";
// import Konva from "konva";

// /**
//  * CanvasWithGrid component - Wraps the Canvas functionality in an InfiniteCanvas
//  * with grid background and panning/zooming capabilities
//  */
// const CanvasWithGrid = () => {
//   const navigate = useNavigate();
//   const { id } = useParams<{ id: string }>();

//   const [canvas, setCanvas] = useState<CanvasType | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [loadedImages, setLoadedImages] = useState<
//     Record<string, HTMLImageElement>
//   >({});

//   // Fetch canvas data
//   useEffect(() => {
//     if (!id) {
//       setError("No canvas ID provided");
//       setLoading(false);
//       return;
//     }

//     const fetchCanvasData = async () => {
//       try {
//         setLoading(true);
//         const canvasData = await getCanvas(id);
//         setCanvas(canvasData);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching canvas:", err);
//         setError("Failed to load canvas");
//         setLoading(false);
//       }
//     };

//     fetchCanvasData();
//   }, [id]);

//   // Render functions
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Loading canvas...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-screen text-red-500">
//         {error}
//       </div>
//     );
//   }

//   if (!canvas) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Canvas not found
//       </div>
//     );
//   }

//   return (
//     <div className="w-screen h-screen overflow-hidden">
//       <div className="absolute top-4 left-4 flex gap-2 z-10">
//         <Button
//           onClick={() => navigate("/canvas-selection")}
//           size="sm"
//           variant="default"
//         >
//           Back to Selection
//         </Button>
//       </div>

//       {/* Render the infinite canvas with grid background */}
//       <InfiniteCanvas
//         gridStep={40}
//         gridColor="rgba(255, 255, 255, 0.2)"
//         gridOpacity={0.3}
//         showControls={true}
//         initialScale={1}
//         minScale={0.1}
//         maxScale={5}
//       >
//         {/* Canvas elements will be rendered here by the Canvas component */}
//         {canvas.elements.map((element) => {
//           // Render canvas elements based on their type
//           if (element.type === "Image" && loadedImages[element.imageId]) {
//             return (
//               <KonvaImage
//                 key={element.id}
//                 id={element.id}
//                 image={loadedImages[element.imageId]}
//                 x={element.data.position.x}
//                 y={element.data.position.y}
//                 width={element.data.size.width}
//                 height={element.data.size.height}
//                 rotation={element.data.rotation || 0}
//                 draggable
//               />
//             );
//           } else if (element.type === "Text") {
//             // Make font size proportional to the element height
//             const fontSize = Math.max(12, element.data.size.height * 0.9);

//             return (
//               <Text
//                 key={element.id}
//                 id={element.id}
//                 text={element.content}
//                 x={element.data.position.x}
//                 y={element.data.position.y}
//                 width={element.data.size.width}
//                 fontSize={fontSize}
//                 fontFamily="Arial"
//                 fill="white"
//                 rotation={element.data.rotation}
//                 draggable
//                 verticalAlign="middle"
//                 align="center"
//                 wrap="word"
//               />
//             );
//           }

//           return null;
//         })}
//       </InfiniteCanvas>
//     </div>
//   );
// };

// export default CanvasWithGrid;
