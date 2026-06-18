"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, Video, X, Plus, CheckCircle2, Film } from "lucide-react";
import { ReelsService } from "@/services/reels.service";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function UploadReelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedDuration, setUploadedDuration] = useState(0);
  const [creating, setCreating] = useState(false);

  // Reel form fields
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 100MB limit");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setUploadedVideoUrl("");
    setUploadProgress(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadedVideoUrl("");
    setUploadedDuration(0);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCreateReel = async () => {
    if (!file || !session?.access) return;

    // Step 1: Upload video
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await ReelsService.uploadVideo(
        file,
        session.access,
        (progress) => setUploadProgress(progress)
      );
      setUploadedVideoUrl(result.videoUrl);
      setUploadedDuration(result.durationSeconds);
      setUploadProgress(100);
      setUploading(false);

      // Step 2: Create reel
      setCreating(true);
      await ReelsService.createReel(
        {
          videoUrl: result.videoUrl,
          durationSeconds: result.durationSeconds,
          caption: caption || undefined,
          tags: tags.length > 0 ? tags : undefined,
        },
        session.access
      );
      toast.success("Reel created successfully!");
      router.push("/dashboard/reels/profile");
    } catch {
      if (uploading) {
        toast.error("Failed to upload video");
      } else {
        toast.error("Failed to create reel");
      }
      setUploading(false);
      setCreating(false);
    }
  };

  const isProcessing = uploading || creating;

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create a Reel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Share a video with the student community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column — Video */}
        <div className="space-y-3">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 lg:min-h-[500px] flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">Click to select a video</p>
              <p className="text-sm text-muted-foreground mt-1">
                MP4, WebM or MOV — up to 100 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden">
              {/* Video Preview */}
              <div className="relative aspect-[9/16] max-h-[500px] mx-auto bg-black">
                <video
                  src={preview || undefined}
                  className="w-full h-full object-contain"
                  controls
                  muted
                />
                {!isProcessing && (
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* File Info & Upload Progress */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Film className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  {uploadedVideoUrl && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={creating ? 100 : uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {uploading
                        ? `Uploading... ${uploadProgress}%`
                        : "Creating your reel..."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Details */}
        <div className="space-y-6 flex flex-col">
          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Caption</label>
            <textarea
              className="w-full p-3 border rounded-xl text-sm min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-transparent"
              placeholder="What's this reel about?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                className="rounded-xl"
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl flex-shrink-0"
                onClick={handleAddTag}
                disabled={isProcessing}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer rounded-full px-3"
                    onClick={() => !isProcessing && handleRemoveTag(tag)}
                  >
                    #{tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Spacer to push button to bottom on large screens */}
          <div className="flex-1" />

          {/* Create Button */}
          <Button
            className="w-full h-12 rounded-xl text-base font-medium"
            onClick={handleCreateReel}
            disabled={!file || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {uploading ? "Uploading..." : "Creating Reel..."}
              </>
            ) : (
              <>
                <Video className="h-5 w-5 mr-2" />
                Create Reel
              </>
            )}
          </Button>
        </div>
      </div>
      </div>
  );
}
