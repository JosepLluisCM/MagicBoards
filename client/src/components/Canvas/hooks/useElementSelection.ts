import { useState, useEffect, useRef } from "react";
import Konva from "konva";
import { Canvas, CanvasElement } from "../../../types/canvas";
import { deleteImage } from "../../../api/services/ImagesService";

export const useElementSelection = (
  canvasData: Canvas | null,
  setCanvasData: (data: Canvas) => void
) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const handleDragStart = (id: string) => {
    if (!canvasData) return;

    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id ? { ...el } : el
      ),
    });
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    if (!canvasData) return;

    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              data: {
                ...el.data,
                position: {
                  ...el.data.position,
                  x,
                  y,
                },
              },
            }
          : el
      ),
    });
  };

  // Update the transformer reference and behavior based on selectedId
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node by id
      const node = transformerRef.current.getStage()?.findOne(`#${selectedId}`);
      if (node) {
        // Reset scale to 1 to avoid compounding scale issues
        node.scaleX(1);
        node.scaleY(1);

        transformerRef.current.nodes([node]);
        // Enable/disable keeping ratio based on Ctrl key state
        transformerRef.current.keepRatio(!isCtrlPressed);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, isCtrlPressed]);

  const handleTransformEnd = (id: string) => {
    if (!canvasData) return;

    // Find the node to get its new properties
    const node = transformerRef.current?.getStage()?.findOne(`#${id}`);
    if (!node) return;

    // Get the current element
    const element = canvasData.elements.find((el) => el.id === id);
    if (!element) return;

    // Calculate new width and height while preserving aspect ratio
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newWidth = Math.abs(node.width() * scaleX);
    const newHeight = Math.abs(node.height() * scaleY);
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

    // Update the element with new position, size, and rotation
    setCanvasData({
      ...canvasData,
      elements: canvasData.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              data: {
                ...el.data,
                position: {
                  ...el.data.position,
                  x: newX,
                  y: newY,
                },
                size: {
                  width: newWidth,
                  height: newHeight,
                },
                rotation: newRotation,
              },
            }
          : el
      ),
    });

    // Reset scale on the node itself, as we've applied it to the width/height
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta") {
      setIsCtrlPressed(true);
    }

    if (e.key === "Delete" && selectedId && canvasData) {
      // Remove the selected element
      setCanvasData({
        ...canvasData,
        elements: canvasData.elements.filter((el) => el.id !== selectedId),
      });
      setSelectedId(null);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta") {
      setIsCtrlPressed(false);
    }
  };

  // Add event listeners for Control key
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedId, canvasData]);

  const handleSelectElement = (id: string) => {
    setSelectedId(id);

    // Ensure any previous transformations are properly applied
    if (transformerRef.current) {
      const nodes = transformerRef.current.nodes();
      if (nodes && nodes.length > 0) {
        const prevNode = nodes[0];
        if (prevNode && prevNode.id() !== id) {
          // Apply any pending transformations to the previously selected node
          handleTransformEnd(prevNode.id());
        }
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (canvasData && selectedId) {
      // Find the element to be deleted
      const elementToDelete = canvasData.elements.find(
        (el) => el.id === selectedId
      );

      try {
        // If it's an image, delete it from the server first
        if (elementToDelete?.imageId) {
          await deleteImage(elementToDelete.imageId);
        }

        // Then remove from canvas data
        setCanvasData({
          ...canvasData,
          elements: canvasData.elements.filter((el) => el.id !== selectedId),
        });
        setSelectedId(null);
      } catch (error) {
        console.error("Failed to delete image:", error);
        // Still remove from canvas even if server deletion fails
        setCanvasData({
          ...canvasData,
          elements: canvasData.elements.filter((el) => el.id !== selectedId),
        });
        setSelectedId(null);
      }
    }
  };

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      // Apply any pending transformations to the previously selected node
      if (selectedId) {
        handleTransformEnd(selectedId);
      }
      setSelectedId(null);
    }
  };

  return {
    selectedId,
    setSelectedId,
    isCtrlPressed,
    transformerRef,
    handleDragStart,
    handleDragEnd,
    handleTransformEnd,
    handleSelectElement,
    handleDeleteSelected,
    checkDeselect,
  };
};
