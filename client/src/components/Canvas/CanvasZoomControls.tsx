import { Button } from "../ui/button";

interface CanvasZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  scale: number;
}

export function CanvasZoomControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  scale,
}: CanvasZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-10 bg-background/80 p-2 rounded-md">
      <Button onClick={onZoomIn} size="sm" variant="outline">
        +
      </Button>
      <Button onClick={onResetView} size="sm" variant="outline">
        {Math.round(scale * 100)}%
      </Button>
      <Button onClick={onZoomOut} size="sm" variant="outline">
        -
      </Button>
    </div>
  );
}
