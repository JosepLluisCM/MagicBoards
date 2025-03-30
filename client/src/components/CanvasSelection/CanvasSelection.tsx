import { useEffect, useRef } from "react";
import { useCanvasSelection } from "./hooks/useCanvasSelection";
import CanvasCard from "./CanvasCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const CanvasSelection = () => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const {
    canvases,
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
  } = useCanvasSelection();

  // Dialog state - replaced useDisclosure
  const dialogOpen = !!canvasToDelete;

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col items-center gap-8 w-full">
        <h1 className="text-3xl font-bold text-center">My Canvases</h1>
        <div className="flex justify-center w-full mb-8">
          <Input
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            placeholder="Enter canvas name"
            className="max-w-[300px] mr-4"
            disabled={isSubmitting}
          />
          <Button onClick={handleCreateCanvas} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create New Canvas"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center w-full py-10">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {canvases.length === 0 ? (
              <div className="text-center col-span-full">
                <p className="text-lg">
                  No canvases found. Create your first canvas above.
                </p>
              </div>
            ) : (
              canvases.map((canvas) => (
                <CanvasCard
                  key={canvas.id}
                  canvas={canvas}
                  onOpen={handleOpenCanvas}
                  onDelete={confirmDelete}
                  isSubmitting={isSubmitting}
                />
              ))
            )}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCancelDelete();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Canvas</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this canvas? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              ref={cancelRef}
              onClick={handleCancelDelete}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                canvasToDelete && handleDeleteCanvas(canvasToDelete)
              }
              className="ml-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvasSelection;
