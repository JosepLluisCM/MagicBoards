import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { Canvas } from "../../types";

interface CanvasCardProps {
  canvas: Canvas;
  onOpen: (id: string) => void;
  onDelete: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
}

const CanvasCard: React.FC<CanvasCardProps> = ({
  canvas,
  onOpen,
  onDelete,
  isSubmitting,
}) => {
  return (
    <Card key={canvas.id} className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{canvas.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8"
            onClick={(e) => onDelete(canvas.id, e)}
            disabled={isSubmitting}
            aria-label="Delete Canvas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Created: {new Date(canvas.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onOpen(canvas.id)} className="w-full">
          Open Canvas
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasCard;
