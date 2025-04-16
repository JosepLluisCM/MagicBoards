// import { useState, useEffect } from "react";
// import { getCanvas } from "../../../api/services/CanvasService";
// import { saveCanvasToServer } from "../../../api/services/ServerCanvasService";
// import {
//   Canvas,
//   CanvasElement,
//   CanvasElementType,
// } from "../../../types/canvas";
// import { toast } from "sonner";

// export const useCanvasData = (id: string | undefined) => {
//   const [canvas, setCanvas] = useState<Canvas | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // Load canvas data from API
//   useEffect(() => {
//     if (!id) return;

//     const fetchCanvasData = async () => {
//       try {
//         // This is the API response, which might have a different structure
//         const canvasFromApi = await getCanvas(id);

//         // Convert API elements to our local format
//         // const convertedElements = (canvasFromApi.elements || []).map(
//         //   (el: any): CanvasElement => ({
//         //     id: el.imageId || Date.now().toString(),
//         //     type:
//         //       el.type === "image"
//         //         ? CanvasElementType.Image
//         //         : CanvasElementType.Text,
//         //     data: {
//         //       position: {
//         //         x: el.position?.X ?? 0,
//         //         y: el.position?.Y ?? 0,
//         //         zIndex: 0,
//         //       },
//         //       size: {
//         //         width: el.size?.Width ?? 100,
//         //         height: el.size?.Height ?? 100,
//         //       },
//         //       rotation: el.rotation || 0,
//         //     },
//         //     content: el.content || "",
//         //     imageId: el.imageId || "",
//         //   })
//         // );

//         // setCanvas({
//         //   id: canvasFromApi.id,
//         //   name: canvasFromApi.name,
//         //   data: {
//         //     position: {
//         //       x: canvasFromApi.data.position.x,
//         //       y: canvasFromApi.data.position.y,
//         //     },
//         //     scale: canvasFromApi.data.scale
//         //   },
//         //   elements: canvasFromApi.elements,
//         //   userId: canvasFromApi.userId,
//         //   createdAt: canvasFromApi.createdAt,
//         //   updatedAt: canvasFromApi.updatedAt,
//         // });

//         setCanvas(canvasFromApi);

//         // Set stage position using CanvasData from the model
//         // if (canvasFromApi.position) {
//         //   setStagePosition({
//         //     position: {
//         //       x: canvasFromApi.position.X || 0,
//         //       y: canvasFromApi.position.Y || 0,
//         //     },
//         //     scale: (canvasFromApi.scale || 100) / 100, // Convert percentage scale back to decimal
//         //   });
//         // }
//       } catch (error) {
//         console.error("Error fetching canvas data:", error);
//         toast.error("Error loading canvas", {
//           description: "Could not load canvas data from the server.",
//           duration: 5000,
//         });
//       }
//     };

//     fetchCanvasData();
//   }, [id]);

//   // Function to manually save the canvas
//   const saveCanvas = async () => {
//     try {
//       // Set the loading state
//       setIsSaving(true);

//       if (!canvasData) {
//         throw new Error("No canvas data to save");
//       }

//       if (!canvasData.id) {
//         console.error("Canvas data is missing ID:", canvasData);
//         throw new Error("Canvas ID is missing");
//       }

//       console.log("Canvas data before saving:", canvasData);
//       console.log("Canvas ID:", canvasData.id);

//       // Convert our local elements to the expected API format
//       const apiElements = canvasData.elements.map((el) => ({
//         Type: el.type,
//         Content: el.content || "",
//         ImageId: el.imageId || "",
//         Position: {
//           X: Math.round(el.data.position.x || 0),
//           Y: Math.round(el.data.position.y || 0),
//         },
//         Size: {
//           Width: Math.round(el.data.size.width || 0),
//           Height: Math.round(el.data.size.height || 0),
//         },
//         Style: {
//           FillColor: "#000000",
//           BorderColor: "#000000",
//           FontSize: 16,
//           Color: "#000000",
//         },
//       }));

//       // Create a Canvas object that matches the expected server type
//       const updatedCanvas = {
//         id: canvasData.id, // Lowercase id property for the internal object
//         Id: canvasData.id, // Uppercase Id for the server format
//         userId: canvasData.userId,
//         UserId: canvasData.userId,
//         name: canvasData.name,
//         Name: canvasData.name,
//         elements: canvasData.elements, // Keep original elements for reference
//         Elements: apiElements, // Formatted elements for the server
//         position: {
//           x: Math.round(stagePosition.position.x),
//           y: Math.round(stagePosition.position.y),
//         },
//         Position: {
//           X: Math.round(stagePosition.position.x),
//           Y: Math.round(stagePosition.position.y),
//         },
//         scale: Math.round(stagePosition.scale * 100),
//         Scale: Math.round(stagePosition.scale * 100),
//         createdAt: canvasData.createdAt || new Date(),
//         CreatedAt: canvasData.createdAt || new Date(),
//         updatedAt: new Date(),
//         UpdatedAt: new Date(),
//       };

//       console.log("Updated canvas before sending:", updatedCanvas);

//       // Use the service to save with proper conversion
//       await saveCanvasToServer(
//         updatedCanvas as any, // Type casting as we know the formats will be converted properly
//         stagePosition.position.x,
//         stagePosition.position.y,
//         stagePosition.scale
//       );

//       toast.success("Canvas saved", {
//         description: "Your changes have been saved successfully.",
//         duration: 3000,
//       });
//     } catch (error) {
//       console.error("Error saving canvas:", error);
//       toast.error("Error saving canvas", {
//         description: error instanceof Error ? error.message : "Unknown error",
//         duration: 5000,
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return {
//     canvasData,
//     setCanvasData,
//     isSaving,
//     setIsSaving,
//     stagePosition,
//     setStagePosition,
//     saveCanvas,
//   };
// };
