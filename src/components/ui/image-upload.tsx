"use client";

import { AlertCircle, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@heroui/react";
import { bucketId } from "@/lib/appwrite/const";
import { useAppwrite } from "@/contexts/appwrite";

interface ImageUploadProps {
  value?: File | string | null; // Can be a new File or an existing File ID
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void; // Callback to clear existing imageId in form
  error?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemoveExisting,
  error,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { storage } = useAppwrite();

  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }

    if (typeof value === "string") {
      setPreview(`/api/files/${value}`);
    }
  }, [value, storage, setPreview]);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) {
      onChange(file);

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleClear = () => {
    onChange(null);
    if (typeof value === "string") {
      onRemoveExisting?.();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all
          ${isDragging ? "border-primary bg-primary/10" : "border-default-300 bg-default-50 hover:bg-default-100"}
          ${preview ? "border-none" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative size-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Entry preview"
              className="h-52 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              className="absolute right-2 top-2 z-50 shadow-md"
              onPress={handleClear}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-content2 text-default-500">
              <ImagePlus className="size-6" />
            </div>
            <p className="text-sm font-medium text-default-700">
              Add progress photo
            </p>
            <p className="text-xs text-default-400 mt-1">
              Click or drag to upload
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-1.5 px-1 text-xs text-danger"
          role="alert"
        >
          <AlertCircle className="size-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
