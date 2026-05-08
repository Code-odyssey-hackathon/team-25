"use client";

// =============================================================================
// JanaVaani — Camera Uploader Component (FR1)
// Mobile-optimized camera capture + file picker with preview
// =============================================================================

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/constants";

interface CameraUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CameraUploader({
  onImageSelected,
  disabled = false,
  className,
}: CameraUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      // Validate type
      if (!APP_CONFIG.allowedImageTypes.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or WebP image.");
        return;
      }

      // Validate size
      if (file.size > APP_CONFIG.maxImageSizeBytes) {
        setError(`Image must be under ${APP_CONFIG.maxImageSizeMB}MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreview(url);
      onImageSelected(file, url);
    },
    [onImageSelected]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        /* Image Preview */
        <div className="relative rounded-xl overflow-hidden border border-border bg-card group">
          <img
            src={preview}
            alt="Issue preview"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Button
            variant="destructive"
            size="icon"
            onClick={clearImage}
            className="absolute top-3 right-3 w-8 h-8 rounded-full shadow-lg"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/80 text-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo captured</span>
          </div>
        </div>
      ) : (
        /* Upload Area */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "h-56 rounded-xl border-2 border-dashed",
            "transition-all duration-300 cursor-pointer",
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP — max {APP_CONFIG.maxImageSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera & Upload Buttons */}
      {!preview && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 rounded-xl h-11"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 rounded-xl h-11"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="w-4 h-4" />
            Gallery
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
