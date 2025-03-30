import { useState, useEffect } from "react";
import { getCanvas } from "../../../api/services/CanvasService";
import { saveCanvasToServer } from "../../../api/services/ServerCanvasService";
import { CanvasData, CanvasElement, StagePosition } from "../../../types";
import { toast } from "sonner";

export const useCanvasData = (id: string | undefined) => {
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stagePosition, setStagePosition] = useState<StagePosition>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Load canvas data from API
  useEffect(() => {
    if (!id) return;

    const fetchCanvasData = async () => {
      try {
        const canvas = await getCanvas(id);

        // Convert API elements to our local format
        const convertedElements = (canvas.elements || []).map(
          (el: any) =>
            ({
              id: el.imageId || Date.now().toString(),
              type: el.type,
              src: el.imageId
                ? `${import.meta.env.VITE_API_URL}/images/${el.imageId}`
                : "",
              imagePath: el.imageId,
              // Use position if available, otherwise fallback to direct coordinates
              x: el.position?.X ?? 0,
              y: el.position?.Y ?? 0,
              // Use size if available, otherwise fallback to width/height
              width: el.size?.Width ?? 100,
              height: el.size?.Height ?? 100,
              rotation: el.rotation || 0,
              isDragging: false,
              // Keep original fields
              content: el.content,
              imageId: el.imageId,
              position: {
                x: el.position?.X ?? 0,
                y: el.position?.Y ?? 0,
                X: el.position?.X ?? 0,
                Y: el.position?.Y ?? 0,
              },
              size: {
                width: el.size?.Width ?? 100,
                height: el.size?.Height ?? 100,
                Width: el.size?.Width ?? 100,
                Height: el.size?.Height ?? 100,
              },
              style: el.style || {
                fillColor: "#000000",
                borderColor: "#000000",
                fontSize: 16,
                color: "#000000",
                FillColor: "#000000",
                BorderColor: "#000000",
                FontSize: 16,
                Color: "#000000",
              },
            } as CanvasElement)
        );

        // Set canvas data with consistent X/Y properties
        setCanvasData({
          id: canvas.id,
          userId: canvas.userId,
          name: canvas.name,
          elements: convertedElements,
          createdAt: canvas.createdAt,
          updatedAt: canvas.updatedAt,
          position: canvas.position
            ? {
                x: canvas.position.X || 0,
                y: canvas.position.Y || 0,
                X: canvas.position.X || 0,
                Y: canvas.position.Y || 0,
              }
            : undefined,
          scale: canvas.scale,
        });

        // Set stage position if it exists in the canvas data
        if (canvas.position) {
          setStagePosition({
            x: canvas.position.X || 0,
            y: canvas.position.Y || 0,
            scale: (canvas.scale || 100) / 100, // Convert percentage scale back to decimal
          });
        }
      } catch (error) {
        console.error("Error fetching canvas data:", error);
        toast.error("Error loading canvas", {
          description: "Could not load canvas data from the server.",
          duration: 5000,
        });
      }
    };

    fetchCanvasData();
  }, [id]);

  // Function to manually save the canvas
  const saveCanvas = async () => {
    try {
      // Set the loading state
      setIsSaving(true);

      if (!canvasData) {
        throw new Error("No canvas data to save");
      }

      if (!canvasData.id) {
        console.error("Canvas data is missing ID:", canvasData);
        throw new Error("Canvas ID is missing");
      }

      console.log("Canvas data before saving:", canvasData);
      console.log("Canvas ID:", canvasData.id);

      // Convert our local elements to the expected API format
      const apiElements = canvasData.elements.map((el) => ({
        Type: el.type,
        Content: el.content || "",
        ImageId: el.imagePath || el.imageId || "",
        Position: {
          X: Math.round(el.x || 0),
          Y: Math.round(el.y || 0),
        },
        Size: {
          Width: Math.round(el.width || 0),
          Height: Math.round(el.height || 0),
        },
        Style: el.style
          ? {
              FillColor: el.style.FillColor || "#000000",
              BorderColor: el.style.BorderColor || "#000000",
              FontSize: el.style.FontSize || 16,
              Color: el.style.Color || "#000000",
            }
          : {
              FillColor: "#000000",
              BorderColor: "#000000",
              FontSize: 16,
              Color: "#000000",
            },
      }));

      // Create a Canvas object that matches the expected server type
      const updatedCanvas = {
        id: canvasData.id, // Lowercase id property for the internal object
        Id: canvasData.id, // Uppercase Id for the server format
        userId: canvasData.userId,
        UserId: canvasData.userId,
        name: canvasData.name,
        Name: canvasData.name,
        elements: canvasData.elements, // Keep original elements for reference
        Elements: apiElements, // Formatted elements for the server
        position: {
          x: Math.round(stagePosition.x),
          y: Math.round(stagePosition.y),
        },
        Position: {
          X: Math.round(stagePosition.x),
          Y: Math.round(stagePosition.y),
        },
        scale: Math.round(stagePosition.scale * 100),
        Scale: Math.round(stagePosition.scale * 100),
        createdAt: canvasData.createdAt || new Date(),
        CreatedAt: canvasData.createdAt || new Date(),
        updatedAt: new Date(),
        UpdatedAt: new Date(),
      };

      console.log("Updated canvas before sending:", updatedCanvas);

      // Use the service to save with proper conversion
      await saveCanvasToServer(
        updatedCanvas as any, // Type casting as we know the formats will be converted properly
        stagePosition.x,
        stagePosition.y,
        stagePosition.scale
      );

      toast.success("Canvas saved", {
        description: "Your changes have been saved successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving canvas:", error);
      toast.error("Error saving canvas", {
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    canvasData,
    setCanvasData,
    isSaving,
    setIsSaving,
    stagePosition,
    setStagePosition,
    saveCanvas,
  };
};
