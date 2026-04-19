import React from "react";
import { Layer, Text, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { CanvasElement, CanvasElementType } from "@/types/canvas";

interface CanvasElementLayerProps {
  elements: CanvasElement[];
  loadedImages: Record<string, HTMLImageElement>;
  transformerRef: React.RefObject<Konva.Transformer>;
  onSelect: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>, elementId: string) => void;
}

export function CanvasElementLayer({
  elements,
  loadedImages,
  transformerRef,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: CanvasElementLayerProps) {
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
          const fontSize = Math.max(12, element.data.size.height * 0.9);

          return (
            <Text
              key={element.id}
              id={element.id}
              text={element.content}
              x={element.data.position.x}
              y={element.data.position.y}
              width={element.data.size.width}
              fontSize={fontSize}
              fontFamily="Arial"
              fill="white"
              rotation={element.data.rotation}
              draggable
              onClick={() => onSelect(element.id)}
              onTap={() => onSelect(element.id)}
              onDragStart={onDragStart}
              onDragEnd={(e) => onDragEnd(e, element.id)}
              onTransformStart={onDragStart}
              onTransformEnd={(e) => onTransformEnd(e, element.id)}
              verticalAlign="middle"
              align="center"
              wrap="word"
            />
          );
        }

        return null;
      })}

      <Transformer
        centeredScaling
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 50 || newBox.height < 50) return oldBox;
          return newBox;
        }}
        anchorSize={8}
        anchorCornerRadius={4}
        enabledAnchors={[
          "top-left",
          "top-center",
          "top-right",
          "middle-right",
          "middle-left",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ]}
      />
    </Layer>
  );
}
