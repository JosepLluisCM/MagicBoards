import { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { useNavigate, useParams } from "react-router-dom";
import { getCanvas, updateCanvas, uploadCanvasPreview } from "@/api/services/CanvasService";
import {
  uploadImage,
  getImage,
  deleteImage,
} from "@/api/services/ImagesService";
import { generateId } from "@/utils/idUtils";
import {
  Canvas as CanvasType,
  CanvasElement,
  CanvasElementType,
} from "@/types/canvas";
import useGrid from "./hooks/useGrid";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasElementLayer } from "./CanvasElementLayer";

function measureTextWidth(text: string, fontSize: number, fontFamily = "Arial"): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

const Canvas = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const gridColor = useMemo(() => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return isDark ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
  }, [theme]);

  //#region STATE
  const [canvas, setCanvas] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  //#endregion STATE

  const {
    stageRef,
    gridLayerRef,
    scale,
    resetView,
    setView,
    handleWheel,
    getCanvasData,
    drawGridLines,
    forceApplyData,
  } = useGrid({
    stepSize: 100,
    gridColor,
    gridOpacity: 0.08,
    showBorder: false,
    minScale: 0.1,
    maxScale: 1.5,
    initialCanvasData: canvas?.data,
    onViewChange: () => {
      scheduleAutoSave();
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const isDirtyRef = useRef(false);
  const isElementDraggingRef = useRef(false);
  const isStagePanningRef = useRef(false);
  const canvasRef = useRef<CanvasType | null>(null);
  const initialViewAppliedRef = useRef(false);

  const markAsSaved = () => {
    setHasUnsavedChanges(false);
    isDirtyRef.current = false;
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  const { pushSnapshot, undo, redo, canUndo, canRedo } = useCanvasHistory();

  const MIN_ELEMENT_SIZE = 20;
  const MAX_ELEMENT_SIZE = 10000;

  //#region HELPERS
  const updateCanvasData = async () => {
    if (!canvas || !stageRef.current) return;
    setCanvas((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: {
          scale: stageRef.current!.scaleX(),
          position: { x: stageRef.current!.x(), y: stageRef.current!.y() },
        },
        updatedAt: new Date().toISOString(),
        elements: prev.elements,
      };
    });
    scheduleAutoSave();
  };

  const debouncedUpdateCanvasData = () => {
    if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      updateCanvasData();
      debounceTimerRef.current = null;
    }, 300);
  };

  // Auto-save: resets the 10s timer on every call.
  // isDirtyRef gates the setState so React only re-renders once per dirty session,
  // not on every pan frame.
  const scheduleAutoSave = () => {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setHasUnsavedChanges(true);
    }
    if (autoSaveTimerRef.current !== null) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      if (isElementDraggingRef.current || isStagePanningRef.current) {
        autoSaveTimerRef.current = window.setTimeout(() => {
          autoSaveTimerRef.current = null;
          saveCanvas();
        }, 2000);
        return;
      }
      saveCanvas();
    }, 10000);
  };
  //#endregion HELPERS

  //#region EFFECTS
  useEffect(() => {
    const fetchCanvasData = async () => {
      if (!id) {
        setError("No canvas ID provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const canvasData = await getCanvas(id);

        if (!canvasData.data) {
          canvasData.data = { position: { x: 0, y: 0 }, scale: 1 };
        } else {
          if (typeof canvasData.data.scale !== "number" || canvasData.data.scale <= 0)
            canvasData.data.scale = 1;
          if (!canvasData.data.position)
            canvasData.data.position = { x: 0, y: 0 };
        }

        const normalizedElements = canvasData.elements.map((element) => ({
          ...element,
          data: {
            ...element.data,
            position: {
              x: element.data.position.x || 0,
              y: element.data.position.y || 0,
              zIndex: element.data.position.zIndex || 0,
            },
            size: {
              width: element.data.size.width || 100,
              height: element.data.size.height || 100,
            },
            rotation: typeof element.data.rotation === "number" ? element.data.rotation : 0,
          },
        }));

        setCanvas({ ...canvasData, elements: normalizedElements });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching canvas:", err);
        setError("Failed to load canvas");
        setLoading(false);
      }
    };
    fetchCanvasData();
  }, [id]);

  useEffect(() => {
    if (!canvas) return;
    canvas.elements
      .filter((el) => el.type === CanvasElementType.Image && el.imageId)
      .forEach(async (element) => {
        if (element.imageId && !loadedImages[element.imageId]) {
          try {
            const imageUrl = await getImage(element.imageId);
            const img = new Image();
            img.src = imageUrl;
            img.onload = () =>
              setLoadedImages((prev) => ({ ...prev, [element.imageId]: img }));
          } catch (err) {
            console.error("Error loading image:", err);
          }
        }
      });
  }, [canvas]);

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(loadedImages).forEach((img) => {
        if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
      });
    };
  }, [loadedImages]);

  // Keyboard shortcuts
  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && canvas && !isInputActive()) {
        const el = canvas.elements.find((x) => x.id === selectedId);
        if (el) {
          if (el.type === CanvasElementType.Text) handleDeleteElement();
          else if (el.type === CanvasElementType.Image) handleDeleteImage();
        }
        return;
      }

      if (e.key === "Escape") { setSelectedId(null); return; }
      if (isInputActive()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "s") { e.preventDefault(); saveCanvas(); return; }

      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        if (!canvas || !canUndo()) return;
        const restored = undo(canvas.elements);
        if (restored) {
          setCanvas((prev) => prev ? { ...prev, elements: restored, updatedAt: new Date().toISOString() } : prev);
          scheduleAutoSave();
        }
        return;
      }

      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        if (!canvas || !canRedo()) return;
        const restored = redo(canvas.elements);
        if (restored) {
          setCanvas((prev) => prev ? { ...prev, elements: restored, updatedAt: new Date().toISOString() } : prev);
          scheduleAutoSave();
        }
        return;
      }

      if (ctrl && e.key === "d") {
        e.preventDefault();
        if (!canvas || !selectedId) return;
        const source = canvas.elements.find((el) => el.id === selectedId);
        if (!source) return;
        pushSnapshot(canvas.elements);
        const duplicate: CanvasElement = {
          ...source,
          id: generateId(),
          data: {
            ...source.data,
            position: { ...source.data.position, x: source.data.position.x + 20, y: source.data.position.y + 20 },
          },
        };
        setCanvas((prev) => prev ? { ...prev, elements: [...prev.elements, duplicate], updatedAt: new Date().toISOString() } : prev);
        setSelectedId(duplicate.id);
        scheduleAutoSave();
        return;
      }

      if (selectedId && canvas && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 10;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setCanvas((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === selectedId
                ? { ...el, data: { ...el.data, position: { ...el.data.position, x: el.data.position.x + dx, y: el.data.position.y + dy } } }
                : el
            ),
            updatedAt: new Date().toISOString(),
          };
        });
        scheduleAutoSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, canvas, canUndo, canRedo]);

  // Sync Transformer nodes when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;
    if (selectedId) {
      const stage = transformerRef.current.getStage();
      const node = stage?.findOne(`#${selectedId}`);
      transformerRef.current.nodes(node ? [node] : []);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  // Restore stage position/scale once on initial load
  useEffect(() => {
    if (canvas?.data && !loading && stageRef.current && !initialViewAppliedRef.current) {
      initialViewAppliedRef.current = true;
      setTimeout(() => forceApplyData(), 0);
    }
  }, [canvas, loading, stageRef.current]);
  //#endregion EFFECTS

  //#region HANDLERS
  // Generates a JPEG thumbnail of the canvas content (or the current view if
  // there are no elements). Returns null if there's nothing meaningful to capture.
  const generatePreviewBlob = async (): Promise<Blob | null> => {
    const stage = stageRef.current;
    const current = canvasRef.current;
    if (!stage || !current || current.elements.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of current.elements) {
      minX = Math.min(minX, el.data.position.x);
      minY = Math.min(minY, el.data.position.y);
      maxX = Math.max(maxX, el.data.position.x + el.data.size.width);
      maxY = Math.max(maxY, el.data.position.y + el.data.size.height);
    }
    const padding = 40;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;

    const sx = stage.scaleX();
    const screenX = minX * sx + stage.x();
    const screenY = minY * sx + stage.y();
    const screenW = (maxX - minX) * sx;
    const screenH = (maxY - minY) * sx;
    if (screenW <= 0 || screenH <= 0) return null;

    const TARGET = 600;
    const pixelRatio = Math.min(1, TARGET / Math.max(screenW, screenH));

    const dataUrl = stage.toDataURL({
      x: screenX,
      y: screenY,
      width: screenW,
      height: screenH,
      pixelRatio,
      mimeType: "image/png",
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const saveCanvas = async () => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas) return;
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsSaving(true);
    try {
      const updatedCanvas = { ...currentCanvas, data: getCanvasData(), updatedAt: new Date().toISOString() };
      await updateCanvas(updatedCanvas);
      markAsSaved();

      try {
        const blob = await generatePreviewBlob();
        if (blob) {
          const path = await uploadCanvasPreview(updatedCanvas.id, blob);
          setCanvas((prev) => prev ? { ...prev, previewImage: path } : prev);
        }
      } catch (previewErr) {
        console.error("Error uploading canvas preview:", previewErr);
      }
    } catch (err) {
      console.error("Error saving canvas:", err);
      setError("Failed to save canvas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !id) return;
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      const imageId = await uploadImage(selectedFile, id);
      const imageUrl = await getImage(imageId);
      const img = new Image();
      img.src = imageUrl;
      img.onload = async () => {
        setLoadedImages((prev) => ({ ...prev, [imageId]: img }));
        const elementId = generateId();
        const stage = stageRef.current;
        const stageScale = stage?.scaleX() ?? 1;
        const stageX = stage?.x() ?? 0;
        const stageY = stage?.y() ?? 0;
        const centerCanvasX = (dimensions.width / 2 - stageX) / stageScale;
        const centerCanvasY = (dimensions.height / 2 - stageY) / stageScale;

        // Fit the image to ~50% of the viewport (in canvas units) so 100% zoom
        // stays a natural working zoom. Never upscale beyond the image's native size.
        const maxWidth = (dimensions.width * 0.5) / stageScale;
        const maxHeight = (dimensions.height * 0.5) / stageScale;
        const fitScale = Math.min(
          1,
          maxWidth / img.naturalWidth,
          maxHeight / img.naturalHeight,
        );
        const width = img.naturalWidth * fitScale;
        const height = img.naturalHeight * fitScale;

        const newElement: CanvasElement = {
          id: elementId,
          type: CanvasElementType.Image,
          data: {
            position: {
              x: centerCanvasX - width / 2,
              y: centerCanvasY - height / 2,
              zIndex: canvas.elements.length + 1,
            },
            size: { width, height },
            rotation: 0,
          },
          content: "",
          imageId,
        };
        const updatedCanvas = { ...canvas, elements: [...canvas.elements, newElement], updatedAt: new Date().toISOString() };
        setCanvas(updatedCanvas);
        try {
          await updateCanvas(updatedCanvas);
          markAsSaved();
        } catch {
          scheduleAutoSave();
        }
      };
      img.onerror = () => {
        setError("Failed to load uploaded image");
        scheduleAutoSave();
      };
    } catch {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddText = () => {
    if (textInputRef.current) {
      textInputRef.current.style.display = "block";
      textInputRef.current.focus();
    }
  };

  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canvas || !textInputRef.current || !stageRef.current) return;
    if (e.key === "Enter" && textInputRef.current.value.trim()) {
      const text = textInputRef.current.value.trim();
      const elementId = generateId();
      const fontSize = 24;
      const lineHeight = 1.2;
      const measuredWidth = Math.ceil(measureTextWidth(text, fontSize)) + 2;
      const height = Math.ceil(fontSize * lineHeight);

      const stage = stageRef.current;
      const stageScale = stage.scaleX();
      const centerCanvasX = (dimensions.width / 2 - stage.x()) / stageScale;
      const centerCanvasY = (dimensions.height / 2 - stage.y()) / stageScale;

      const newElement: CanvasElement = {
        id: elementId,
        type: CanvasElementType.Text,
        data: {
          position: {
            x: centerCanvasX - measuredWidth / 2,
            y: centerCanvasY - height / 2,
            zIndex: 0,
          },
          size: { width: measuredWidth, height },
          rotation: 0,
        },
        content: text,
        imageId: "",
        fontSize,
      };
      setCanvas((prev) => prev ? { ...prev, elements: [...prev.elements, newElement], updatedAt: new Date().toISOString() } : prev);
      textInputRef.current.value = "";
      textInputRef.current.style.display = "none";
      scheduleAutoSave();
      setSelectedId(elementId);
    }
  };

  const handleElementDragStart = () => { isElementDraggingRef.current = true; };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    if (!canvas) return;
    pushSnapshot(canvas.elements);
    isElementDraggingRef.current = false;
    const newX = e.target.x();
    const newY = e.target.y();
    setCanvas((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === elementId
            ? { ...el, data: { ...el.data, position: { ...el.data.position, x: newX, y: newY } } }
            : el
        ),
        updatedAt: new Date().toISOString(),
        data: prev.data,
      };
    });
    scheduleAutoSave();
  };

  const handleDeleteImage = async () => {
    if (!canvas || !selectedId) return;
    const element = canvas.elements.find((el) => el.id === selectedId);
    if (!element || element.type !== CanvasElementType.Image) return;
    pushSnapshot(canvas.elements);
    try {
      await deleteImage(element.imageId);
      setLoadedImages((prev) => { const next = { ...prev }; delete next[element.imageId]; return next; });
      const updatedCanvas = { ...canvas, elements: canvas.elements.filter((el) => el.id !== selectedId), updatedAt: new Date().toISOString() };
      setCanvas(updatedCanvas);
      setSelectedId(null);
      markAsSaved();
      setIsSaving(true);
      try {
        await updateCanvas(updatedCanvas);
      } catch {
        scheduleAutoSave();
      } finally {
        setIsSaving(false);
      }
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleDeleteElement = () => {
    if (!canvas || !selectedId) return;
    const element = canvas.elements.find((el) => el.id === selectedId);
    if (!element) return;
    pushSnapshot(canvas.elements);
    const elementsAfterDelete = canvas.elements.filter((el) => el.id !== selectedId);
    setCanvas((prev) => prev ? { ...prev, elements: elementsAfterDelete, updatedAt: new Date().toISOString() } : prev);
    setSelectedId(null);
    scheduleAutoSave();
    toast("Element deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          setCanvas((prev) => prev ? { ...prev, elements: canvas.elements, updatedAt: new Date().toISOString() } : prev);
          scheduleAutoSave();
        },
      },
    });
  };

  const handleBringToFront = () => {
    if (!canvas || !selectedId) return;
    pushSnapshot(canvas.elements);
    setCanvas((prev) => {
      if (!prev) return prev;
      const idx = prev.elements.findIndex((el) => el.id === selectedId);
      if (idx === -1 || idx === prev.elements.length - 1) return prev;
      const elements = [...prev.elements];
      const [moved] = elements.splice(idx, 1);
      elements.push(moved);
      return { ...prev, elements, updatedAt: new Date().toISOString() };
    });
    scheduleAutoSave();
  };

  const handleSendToBack = () => {
    if (!canvas || !selectedId) return;
    pushSnapshot(canvas.elements);
    setCanvas((prev) => {
      if (!prev) return prev;
      const idx = prev.elements.findIndex((el) => el.id === selectedId);
      if (idx === -1 || idx === 0) return prev;
      const elements = [...prev.elements];
      const [moved] = elements.splice(idx, 1);
      elements.unshift(moved);
      return { ...prev, elements, updatedAt: new Date().toISOString() };
    });
    scheduleAutoSave();
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, elementId: string) => {
    if (!canvas) return;
    pushSnapshot(canvas.elements);
    const node = e.target;
    const element = canvas.elements.find((el) => el.id === elementId);
    if (!element) return;

    const scaleX = node.scaleX();

    if (element.type === CanvasElementType.Text) {
      const currentFontSize = element.fontSize ?? 24;
      const requestedFontSize = currentFontSize * scaleX;
      const newFontSize = Math.max(8, Math.min(400, requestedFontSize));
      const effectiveScale = newFontSize / currentFontSize;
      const newWidth = element.data.size.width * effectiveScale;
      const newHeight = element.data.size.height * effectiveScale;
      const newX = node.x();
      const newY = node.y();
      const newRotation = node.rotation();

      node.setAttrs({ scaleX: 1, scaleY: 1, width: newWidth, height: newHeight, fontSize: newFontSize, x: newX, y: newY, rotation: newRotation });

      setCanvas((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === elementId
              ? {
                  ...el,
                  data: {
                    ...el.data,
                    position: { ...el.data.position, x: newX, y: newY },
                    size: { width: newWidth, height: newHeight },
                    rotation: newRotation,
                  },
                  fontSize: newFontSize,
                }
              : el
          ),
          updatedAt: new Date().toISOString(),
          data: prev.data,
        };
      });
      scheduleAutoSave();
      return;
    }

    const aspectRatio = node.height() / node.width();
    const requestedWidth = node.width() * scaleX;
    let newWidth = Math.min(MAX_ELEMENT_SIZE, Math.max(MIN_ELEMENT_SIZE, requestedWidth));
    let newHeight = newWidth * aspectRatio;
    if (newHeight > MAX_ELEMENT_SIZE) {
      newHeight = MAX_ELEMENT_SIZE;
      newWidth = newHeight / aspectRatio;
    }
    const newX = node.x();
    const newY = node.y();
    const newRotation = node.rotation();

    node.setAttrs({ scaleX: 1, scaleY: 1, width: newWidth, height: newHeight, x: newX, y: newY, rotation: newRotation });

    setCanvas((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === elementId
            ? { ...el, data: { ...el.data, position: { ...el.data.position, x: newX, y: newY }, size: { width: newWidth, height: newHeight }, rotation: newRotation } }
            : el
        ),
        updatedAt: new Date().toISOString(),
        data: prev.data,
      };
    });
    scheduleAutoSave();
  };

  const fitToContent = () => {
    if (!canvas || !stageRef.current) return;
    if (canvas.elements.length === 0) { resetView(); scheduleAutoSave(); return; }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of canvas.elements) {
      minX = Math.min(minX, el.data.position.x);
      minY = Math.min(minY, el.data.position.y);
      maxX = Math.max(maxX, el.data.position.x + el.data.size.width);
      maxY = Math.max(maxY, el.data.position.y + el.data.size.height);
    }

    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const newScale = Math.min(
      Math.max(Math.min(dimensions.width / contentW, dimensions.height / contentH), 0.1),
      1.5,
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPos = {
      x: dimensions.width / 2 - centerX * newScale,
      y: dimensions.height / 2 - centerY * newScale,
    };
    setView(newScale, newPos);
    scheduleAutoSave();
  };

  const handleWheelWithUpdate = (e: Konva.KonvaEventObject<WheelEvent>) => {
    handleWheel(e);
    debouncedUpdateCanvasData();
  };
  //#endregion HANDLERS

  //#region RENDER HELPERS
  const selectedElement = selectedId && canvas ? canvas.elements.find((el) => el.id === selectedId) : null;
  const isImageSelected = selectedElement?.type === CanvasElementType.Image;
  const isTextSelected = selectedElement?.type === CanvasElementType.Text;
  //#endregion RENDER HELPERS

  //#region RENDERING
  if (loading)
    return <div className="flex items-center justify-center h-screen">Loading canvas...</div>;
  if (error)
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  if (!canvas)
    return <div className="flex items-center justify-center h-screen">Canvas not found</div>;

  return (
    <div className="w-screen h-screen overflow-hidden relative" tabIndex={0}>
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 select-none pointer-events-none">
          <span className="text-white text-sm font-medium tracking-wide">Saving…</span>
        </div>
      )}

      <CanvasToolbar
        onBack={() => navigate("/canvas-selection")}
        onUploadClick={handleUploadClick}
        isUploading={isUploading}
        onAddText={handleAddText}
        isElementSelected={!!selectedId}
        isImageSelected={!!isImageSelected}
        onDeleteImage={handleDeleteImage}
        isTextSelected={!!isTextSelected}
        onDeleteElement={handleDeleteElement} 
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onSave={saveCanvas}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        fileInputRef={fileInputRef}
        textInputRef={textInputRef}
        onFileChange={handleFileChange}
        onTextInputKeyDown={handleTextInputKeyDown}
        scale={scale}
        onResetView={fitToContent}
      />

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={false}
        onClick={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
        onWheel={handleWheelWithUpdate}
        onMouseDown={(e) => {
          if (e.evt.button === 1 && stageRef.current && !isElementDraggingRef.current) {
            stageRef.current.draggable(true);
            isStagePanningRef.current = true;
          }
        }}
        onMouseUp={(e) => {
          if (e.evt.button === 1 && stageRef.current) {
            stageRef.current.draggable(false);
            isStagePanningRef.current = false;
          }
        }}
        onDragEnd={() => {
          drawGridLines();
          if (!hasUnsavedChanges) scheduleAutoSave();
          if (stageRef.current) stageRef.current.draggable(false);
          debouncedUpdateCanvasData();
        }}
        onDragMove={() => drawGridLines()}
        className="bg-black/10"
      >
        <Layer ref={gridLayerRef} />
        <CanvasElementLayer
          elements={canvas.elements}
          loadedImages={loadedImages}
          transformerRef={transformerRef}
          selectedElementType={selectedElement?.type}
          onSelect={setSelectedId}
          onDragStart={handleElementDragStart}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
      </Stage>
    </div>
  );
  //#endregion RENDERING
};

export default Canvas;
