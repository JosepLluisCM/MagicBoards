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
import { LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";

const CanvasSelection = () => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const {
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
  } = useCanvasSelection();

  const dialogOpen = !!canvasToDelete;

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen pb-28">
      {/* Page header */}
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-8 md:px-10">
        <h1 className="text-2xl font-bold">My Canvases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a board to continue working
        </p>
      </div>

      {/* Canvas grid */}
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : canvasesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <LayoutTemplate className="mb-4 h-12 w-12 opacity-25" />
            <p className="text-sm">
              No canvases yet — create your first one below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {canvasesList.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                canvas={canvas}
                onOpen={handleOpenCanvas}
                onDelete={confirmDelete}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating bottom create bar */}
      <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card/95 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
          <Input
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCanvas()}
            placeholder="New canvas name…"
            className="h-8 w-52 border-none bg-transparent px-3 text-sm focus-visible:ring-0"
            disabled={isSubmitting}
          />
          <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
          <Button
            onClick={handleCreateCanvas}
            disabled={isSubmitting || !newCanvasName.trim()}
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-4 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {isSubmitting ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancelDelete();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Canvas</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this canvas? You will lose all
              images inside.
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
              {isSubmitting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvasSelection;
