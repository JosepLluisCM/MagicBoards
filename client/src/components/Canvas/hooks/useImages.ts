import { useState, useEffect } from "react";
import { uploadImage } from "../../../api/services/ImagesService";
import {
  Canvas,
  CanvasElement,
  CanvasElementType,
} from "../../../types/canvas";
import { ImageType } from "../../../types/image";
import { toast } from "sonner";

export const useImages = (
  canvasData: Canvas | null,
  setCanvasData: (data: Canvas) => void
) => {
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});

  // Load images when canvas data changes
  useEffect(() => {
    if (!canvasData) return;

    const imageElements = canvasData.elements.filter(
      (el) => el.type === CanvasElementType.Image
    );
    const newImages: { [key: string]: HTMLImageElement } = {};

    imageElements.forEach((element) => {
      if (element.id && !images[element.id]) {
        const img = new Image();
        // Get image from the API endpoint
        if (element.imageId) {
          img.src = `${import.meta.env.VITE_API_URL}/images/${element.imageId}`;
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
      const imageId = await uploadImage(file, {
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

        // Calculate center position by default
        let x = dimensions.width / 2 - width / 2;
        let y = dimensions.height / 2 - height / 2;

        const newElementId = Date.now().toString();

        // Create new element using the new data model
        const newElement: CanvasElement = {
          id: newElementId,
          type: CanvasElementType.Image,
          data: {
            position: {
              x,
              y,
              zIndex: 0,
            },
            size: {
              width,
              height,
            },
            rotation: 0,
          },
          content: "",
          imageId,
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
      img.src = `${import.meta.env.VITE_API_URL}/images/${imageId}`;
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
