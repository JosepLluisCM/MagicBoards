import React from "react";
import { Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { CanvasElement, CanvasElementType } from "@/types/canvas";

interface CanvasElementLayerProps {
  elements: CanvasElement[];
  loadedImages: Record<string, HTMLImageElement>;
  transformerRef: React.RefObject<Konva.Transformer>;
  selectedElementType?: CanvasElementType;
  onSelect: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>, elementId: string) => void;
}

export function CanvasElementLayer({
  elements,
  loadedImages,
  transformerRef,
  selectedElementType,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: CanvasElementLayerProps) {
  const isAspectRatioLocked =
    selectedElementType === CanvasElementType.Text ||
    selectedElementType === CanvasElementType.Image;

  return (
    <Layer>
      {elements.map((element) => {
        if (element.type === CanvasElementType.Image) {
          const image = loadedImages[element.imageId];
          if (!image) return null;

          return (
            <KonvaImage
              key={element.id}
              id={element.id}
              image={image}
              x={element.data.position.x}
              y={element.data.position.y}
              width={element.data.size.width}
              height={element.data.size.height}
              rotation={element.data.rotation || 0}
              draggable
              onClick={() => onSelect(element.id)}
              onTap={() => onSelect(element.id)}
              onDragStart={onDragStart}
              onDragEnd={(e) => onDragEnd(e, element.id)}
              onTransformStart={onDragStart}
              onTransformEnd={(e) => onTransformEnd(e, element.id)}
            />
          );
        }

        if (element.type === CanvasElementType.Text) {
          const fontSize = element.fontSize ?? 24;

          return (
            <Text
              key={element.id}
              id={element.id}
              text={element.content}
              x={element.data.position.x}
              y={element.data.position.y}
              width={element.data.size.width}
              height={element.data.size.height}
              fontSize={fontSize}
              fontFamily="Arial"
              fill="white"
              rotation={element.data.rotation}
              draggable
              wrap="none"
              lineHeight={1.2}
              onClick={() => onSelect(element.id)}
              onTap={() => onSelect(element.id)}
              onDragStart={onDragStart}
              onDragEnd={(e) => onDragEnd(e, element.id)}
              onTransformStart={onDragStart}
              onTransformEnd={(e) => onTransformEnd(e, element.id)}
            />
          );
        }

        return null;
      })}

      <Transformer
        ref={transformerRef}
        keepRatio={isAspectRatioLocked}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) return oldBox;
          return newBox;
        }}
        anchorSize={12}
        anchorCornerRadius={4}
        anchorStroke="#3b82f6"
        anchorFill="white"
        borderStroke="#3b82f6"
        rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        rotationSnapTolerance={8}
        enabledAnchors={
          isAspectRatioLocked
            ? ["top-left", "top-right", "bottom-left", "bottom-right"]
            : [
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "middle-left",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]
        }
      />
    </Layer>
  );
}
