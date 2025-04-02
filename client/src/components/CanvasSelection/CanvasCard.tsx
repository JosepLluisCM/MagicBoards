import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { CanvasListItem } from "@/types/CanvasListItem";
import { formatDate } from "@/utils/timeUtils";

interface CanvasCardProps {
  canvas: CanvasListItem;
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
  const { id, name, createdAt, updatedAt, userId } = canvas;

  return (
    <Card key={id} className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8"
            onClick={(e) => onDelete(id, e)}
            disabled={isSubmitting}
            aria-label="Delete Canvas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>User: {userId}</p>
          <p>Created: {formatDate(createdAt)}</p>
          <p>Updated: {formatDate(updatedAt)}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onOpen(id)} className="w-full">
          Open Canvas
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasCard;
