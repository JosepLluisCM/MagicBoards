import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasHistory } from "../useCanvasHistory";
import type { CanvasElement } from "@/types/canvas";
import { CanvasElementType } from "@/types/canvas";

// Minimal element factory
const el = (id: string): CanvasElement => ({
  id,
  type: CanvasElementType.Text,
  content: id,
  imageId: "",
  data: {
    position: { x: 0, y: 0, zIndex: 0 },
    size: { width: 100, height: 50 },
    rotation: 0,
  },
});

describe("useCanvasHistory", () => {
  it("starts with empty stacks", () => {
    const { result } = renderHook(() => useCanvasHistory());
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it("canUndo after pushSnapshot", () => {
    const { result } = renderHook(() => useCanvasHistory());
    act(() => result.current.pushSnapshot([el("a")]));
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(false);
  });

  it("undo returns previous snapshot", () => {
    const { result } = renderHook(() => useCanvasHistory());
    const snapshot = [el("a"), el("b")];
    act(() => result.current.pushSnapshot(snapshot));
    const current = [el("a"), el("b"), el("c")];
    const restored = result.current.undo(current);
    expect(restored).toEqual(snapshot);
  });

  it("undo enables redo", () => {
    const { result } = renderHook(() => useCanvasHistory());
    act(() => result.current.pushSnapshot([el("a")]));
    result.current.undo([el("a"), el("b")]);
    expect(result.current.canRedo()).toBe(true);
  });

  it("redo restores undone state", () => {
    const { result } = renderHook(() => useCanvasHistory());
    const initial = [el("a")];
    const next = [el("a"), el("b")];
    act(() => result.current.pushSnapshot(initial));
    result.current.undo(next);
    const redone = result.current.redo(initial);
    expect(redone).toEqual(next);
  });

  it("pushSnapshot clears redo stack", () => {
    const { result } = renderHook(() => useCanvasHistory());
    act(() => result.current.pushSnapshot([el("a")]));
    result.current.undo([el("a"), el("b")]);
    expect(result.current.canRedo()).toBe(true);
    act(() => result.current.pushSnapshot([el("c")]));
    expect(result.current.canRedo()).toBe(false);
  });

  it("undo on empty stack returns null", () => {
    const { result } = renderHook(() => useCanvasHistory());
    expect(result.current.undo([])).toBeNull();
  });

  it("redo on empty stack returns null", () => {
    const { result } = renderHook(() => useCanvasHistory());
    expect(result.current.redo([])).toBeNull();
  });

  it("respects MAX_HISTORY of 50", () => {
    const { result } = renderHook(() => useCanvasHistory());
    for (let i = 0; i < 55; i++) {
      act(() => result.current.pushSnapshot([el(`e${i}`)]));
    }
    // Can still undo — stack is capped at 50, not zero
    expect(result.current.canUndo()).toBe(true);
    // Undo 50 times should drain the stack
    const current: CanvasElement[] = [];
    for (let i = 0; i < 50; i++) result.current.undo(current);
    expect(result.current.canUndo()).toBe(false);
  });
});
