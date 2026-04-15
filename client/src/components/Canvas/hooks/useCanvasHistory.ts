import { useRef } from "react";
import { CanvasElement } from "@/types/canvas";

const MAX_HISTORY = 50;

export function useCanvasHistory() {
  const past = useRef<CanvasElement[][]>([]);
  const future = useRef<CanvasElement[][]>([]);

  const pushSnapshot = (elements: CanvasElement[]) => {
    past.current.push([...elements]);
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
  };

  const undo = (currentElements: CanvasElement[]): CanvasElement[] | null => {
    if (past.current.length === 0) return null;
    const previous = past.current.pop()!;
    future.current.push([...currentElements]);
    return previous;
  };

  const redo = (currentElements: CanvasElement[]): CanvasElement[] | null => {
    if (future.current.length === 0) return null;
    const next = future.current.pop()!;
    past.current.push([...currentElements]);
    return next;
  };

  const canUndo = () => past.current.length > 0;
  const canRedo = () => future.current.length > 0;

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
