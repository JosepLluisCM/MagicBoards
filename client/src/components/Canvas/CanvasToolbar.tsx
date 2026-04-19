import React from "react";
import { Button } from "../ui/button";

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
}

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
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-4 flex gap-2 z-10">
      <Button onClick={onBack} size="sm" variant="default">
        Back to Selection
      </Button>
      <Button
        onClick={onUploadClick}
        size="sm"
        variant="default"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </Button>
      <Button onClick={onAddText} size="sm" variant="default">
        Add Text
      </Button>
      {isElementSelected && (
        <>
          <Button onClick={onBringToFront} size="sm" variant="outline">
            Bring to Front
          </Button>
          <Button onClick={onSendToBack} size="sm" variant="outline">
            Send to Back
          </Button>
        </>
      )}
      {isImageSelected && (
        <Button onClick={onDeleteImage} size="sm" variant="destructive">
          Delete Image
        </Button>
      )}
      {isTextSelected && (
        <Button onClick={onDeleteElement} size="sm" variant="destructive">
          Delete Text
        </Button>
      )}
      <Button
        onClick={onSave}
        size="sm"
        variant={hasUnsavedChanges ? "destructive" : "default"}
        disabled={isSaving || !hasUnsavedChanges}
      >
        {isSaving ? "Saving…" : hasUnsavedChanges ? "Save*" : "Saved ✓"}
      </Button>

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
        style={{
          display: "none",
          position: "absolute",
          top: "60px",
          left: "10px",
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          zIndex: 1000,
        }}
        placeholder="Enter text and press Enter"
        onKeyDown={onTextInputKeyDown}
      />
    </div>
  );
}
