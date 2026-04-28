import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutTemplate, X } from "lucide-react";
import { canvasListItem } from "@/types/CanvasListItem";
import { formatDate } from "@/utils/timeUtils";
import { getImage } from "@/api/services/ImagesService";

interface CanvasCardProps {
  canvas: canvasListItem;
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
  const { id, name, createdAt, updatedAt, previewImage } = canvas;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewImage) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    getImage(previewImage, updatedAt)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewImage, updatedAt]);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
      onClick={() => onOpen(id)}
    >
      {/* Canvas preview */}
      <div className="flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-primary/8 to-transparent">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${name} preview`}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <LayoutTemplate className="h-9 w-9 text-primary/35 transition-colors duration-200 group-hover:text-primary/55" />
        )}
      </div>

      <CardHeader className="pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold leading-snug">{name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-0.5 h-6 w-6 shrink-0 opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id, e);
            }}
            disabled={isSubmitting}
            aria-label="Delete Canvas"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>Updated {formatDate(updatedAt)}</p>
          <p className="opacity-60">Created {formatDate(createdAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CanvasCard;
