"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10; // HEIC files can be larger before conversion

const HEIC_TYPES = ["image/heic", "image/heif"];

async function convertIfHeic(file: File): Promise<File> {
  if (!HEIC_TYPES.includes(file.type) && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
    return file;
  }
  // Dynamically import to avoid SSR issues
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}

interface PhotoUploaderProps {
  photoUrls: string[];
  onPhotosChange: (urls: string[]) => void;
  onUpload: (files: File[]) => Promise<string[]>;
  disabled?: boolean;
}

export function PhotoUploader({
  photoUrls,
  onPhotosChange,
  onUpload,
  disabled,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = MAX_FILES - photoUrls.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} photos allowed.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      // Convert any HEIC/HEIF files to JPEG first
      const converted = await Promise.all(selected.map(convertIfHeic));

      // Validate sizes after conversion
      const oversized = converted.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (oversized.length > 0) {
        toast.error(`Each photo must be under ${MAX_SIZE_MB} MB.`);
        return;
      }

      const urls = await onUpload(converted);
      onPhotosChange([...photoUrls, ...urls]);
    } catch {
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const updated = photoUrls.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photoUrls.map((url, index) => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
            <Image
              src={url}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              disabled={disabled}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photoUrls.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || disabled}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-xs">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Up to {MAX_FILES} photos · Max {MAX_SIZE_MB} MB each · HEIC/HEIF supported
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
