import { useState, useEffect } from "react";
import { uploadImage } from "../../../api/services/ImagesService";
import { CanvasData, CanvasElement } from "../../../types";
import { toast } from "sonner";

export const useImages = (
  canvasData: CanvasData | null,
  setCanvasData: (data: CanvasData) => void
) => {
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});

  // Load images when canvas data changes
  useEffect(() => {
    if (!canvasData) return;

    const imageElements = canvasData.elements.filter(
      (el) => el.type === "image"
    );
    const newImages: { [key: string]: HTMLImageElement } = {};

    imageElements.forEach((element) => {
      if (element.id && !images[element.id]) {
        const img = new Image();
        // If we have a server imagePath, use the API endpoint to get the image
        if (element.imagePath) {
          img.src = `${import.meta.env.VITE_API_URL}/images/${
            element.imagePath
          }`;
        } else if (element.src) {
          // For backwards compatibility or local files not yet uploaded
          img.src = element.src;
        }
        newImages[element.id] = img;
      }
    });

    if (Object.keys(newImages).length > 0) {
      setImages((prev) => ({ ...prev, ...newImages }));
    }
  }, [canvasData, images]);

  const handleFileUpload = async (
    file: File,
    dimensions: { width: number; height: number }
  ) => {
    if (!canvasData) return;

    try {
      // First, upload the image to the server with both userId and canvasId
      const imagePath = await uploadImage(file, {
        userId: canvasData.userId,
        canvasId: canvasData.id,
      });

      // Load the image to get its dimensions
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions to fit the image properly
        const maxWidth = dimensions.width * 0.5;
        const maxHeight = dimensions.height * 0.5;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        if (height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = width * ratio;
        }

        // Calculate center position by default (can be overridden by point params)
        let x = dimensions.width / 2 - width / 2;
        let y = dimensions.height / 2 - height / 2;

        const newElementId = Date.now().toString();
        const newElement: CanvasElement = {
          id: newElementId,
          type: "image",
          imagePath: imagePath, // Store the path from the server
          imageId: imagePath, // Also store as imageId for API compatibility
          src: img.src, // We still need this for the image to display locally
          x,
          y,
          width,
          height,
          rotation: 0,
          isDragging: false,
          // Add required fields for API compatibility in C# format
          position: {
            x,
            y,
            X: Math.round(x),
            Y: Math.round(y),
          },
          size: {
            width: Math.round(width),
            height: Math.round(height),
            Width: Math.round(width),
            Height: Math.round(height),
          },
          style: {
            fillColor: "#000000",
            borderColor: "#000000",
            fontSize: 16,
            color: "#000000",
            FillColor: "#000000",
            BorderColor: "#000000",
            FontSize: 16,
            Color: "#000000",
          },
        };

        // Add the new image to the images state
        setImages((prev) => ({
          ...prev,
          [newElementId]: img,
        }));

        // Add the new element to the canvas data
        setCanvasData({
          ...canvasData,
          elements: [...canvasData.elements, newElement],
        });
      };

      // Set the source to the API endpoint for the uploaded image
      img.src = `${import.meta.env.VITE_API_URL}/images/${imagePath}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image", {
        description: "Could not upload the image to the server.",
        duration: 5000,
      });
    }
  };

  return {
    images,
    handleFileUpload,
  };
};
