import React from "react";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BringToFront,
  Check,
  ImagePlus,
  Save,
  SendToBack,
  Trash2,
  Type,
} from "lucide-react";

interface CanvasToolbarProps {
  onBack: () => void;
  onUploadClick: () => void;
  isUploading: boolean;
  onAddText: () => void;
  isElementSelected: boolean;
  isImageSelected: boolean;
  onDeleteImage: () => void;
  isTextSelected: boolean;
  onDeleteElement: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  scale: number | null;
  onResetView: () => void;
}

const Divider = () => <div className="mx-1 h-5 w-px shrink-0 bg-border" />;

export function CanvasToolbar({
  onBack,
  onUploadClick,
  isUploading,
  onAddText,
  isElementSelected,
  isImageSelected,
  onDeleteImage,
  isTextSelected,
  onDeleteElement,
  onBringToFront,
  onSendToBack,
  onSave,
  isSaving,
  hasUnsavedChanges,
  fileInputRef,
  textInputRef,
  onFileChange,
  onTextInputKeyDown,
  scale,
  onResetView,
}: CanvasToolbarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 select-none">
      <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card/95 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <Divider />

        {/* Upload Image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUploadClick}
          disabled={isUploading}
          className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {isUploading ? "Uploading…" : "Image"}
        </Button>

        {/* Add Text */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddText}
          className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <Type className="h-3.5 w-3.5" />
          Text
        </Button>

        {/* Layering — only when an element is selected */}
        {isElementSelected && (
          <>
            <Divider />
            <Button
              variant="ghost"
              size="sm"
              onClick={onBringToFront}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <BringToFront className="h-3.5 w-3.5" />
              Front
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSendToBack}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <SendToBack className="h-3.5 w-3.5" />
              Back
            </Button>
          </>
        )}

        {/* Delete — only when image or text is selected */}
        {(isImageSelected || isTextSelected) && (
          <>
            <Divider />
            <Button
              variant="ghost"
              size="sm"
              onClick={isImageSelected ? onDeleteImage : onDeleteElement}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}

        <Divider />

        {/* Save */}
        <Button
          size="sm"
          variant={hasUnsavedChanges ? "default" : "ghost"}
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={cn(
            "h-8 gap-1.5 rounded-lg px-3 text-xs",
            !hasUnsavedChanges && "text-muted-foreground",
          )}
        >
          {isSaving ? (
            <>
              <LoadingSpinner className="h-3.5 w-3.5" />
              Saving…
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Save className="h-3.5 w-3.5" />
              Save
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved
            </>
          )}
        </Button>

        <Divider />

        {/* Zoom counter — click to reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetView}
          title="Click to reset zoom"
          className="h-8 min-w-[3rem] rounded-lg px-3 text-xs tabular-nums text-muted-foreground hover:text-foreground"
        >
          {scale !== null ? Math.round(scale * 100) : 100}%
        </Button>
      </div>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={onFileChange}
      />
      <input
        type="text"
        ref={textInputRef}
        style={{ display: "none" }}
        className="fixed top-[-120%] left-1/2 z-50 min-w-[360px] -translate-x-1/2 rounded-lg border border-foreground/40 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-500/50"
        placeholder="Enter text and press Enter"
        onKeyDown={onTextInputKeyDown}
      />
    </div>
  );
}
