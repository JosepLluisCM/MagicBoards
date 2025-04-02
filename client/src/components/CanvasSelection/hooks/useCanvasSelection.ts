import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCanvasesForUser,
  createCanvas,
  deleteCanvas,
  getCanvas,
} from "../../../api/services/CanvasService";
import { CanvasListItem } from "@/types/CanvasListItem";

export const useCanvasSelection = () => {
  const navigate = useNavigate();
  const [canvasesList, setCanvasesList] = useState<CanvasListItem[]>([]);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load canvases from API on component mount
  useEffect(() => {
    const loadCanvases = async () => {
      setIsLoading(true);
      try {
        const loadedCanvases = await getCanvasesForUser();
        // Sort canvases by updatedAt date in descending order (newest first)
        const sortedCanvases = [...loadedCanvases].sort((a, b) => {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        setCanvasesList(sortedCanvases as CanvasListItem[]);
        setError(null);
      } catch (err) {
        console.error("Error loading canvases:", err);
        setError("Failed to load canvases. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvases();
  }, []);

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) return;

    setIsSubmitting(true);
    try {
      const newCanvas = await createCanvas(newCanvasName);
      // Add new canvas and re-sort the list to ensure the most recently updated is at the top
      const updatedList = [...canvasesList, newCanvas as CanvasListItem].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setCanvasesList(updatedList);
      setNewCanvasName("");
      setError(null);
    } catch (err) {
      console.error("Error creating canvas:", err);
      setError("Failed to create new canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCanvas = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteCanvas(id);
      // Remove the canvas from the state and ensure sorting is maintained
      const updatedCanvases = canvasesList
        .filter((canvas) => canvas.id !== id)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      setCanvasesList(updatedCanvases);
      setError(null);
      // Clear the canvas to delete after successful deletion
      setCanvasToDelete(null);
    } catch (err) {
      console.error("Error deleting canvas:", err);
      setError("Failed to delete canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set the ID to delete - actual deletion happens after confirmation
    setCanvasToDelete(id);
  };

  const handleOpenCanvas = async (id: string) => {
    setIsSubmitting(true);
    try {
      // Get canvas data before navigation
      await getCanvas(id);
      // If successful, navigate to the canvas
      navigate(`/canvas/${id}`);
      setError(null);
    } catch (err) {
      console.error("Error retrieving canvas:", err);
      setError("Failed to open canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setCanvasToDelete(null);
  };

  return {
    canvasesList,
    newCanvasName,
    setNewCanvasName,
    canvasToDelete,
    isLoading,
    error,
    isSubmitting,
    handleCreateCanvas,
    handleDeleteCanvas,
    confirmDelete,
    handleOpenCanvas,
    handleCancelDelete,
  };
};
