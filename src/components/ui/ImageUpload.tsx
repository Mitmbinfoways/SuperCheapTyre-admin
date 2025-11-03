"use client";

import React, { useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import Image from "next/image";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxSizeMB?: number;
  maxFiles?: number;
  multiple?: boolean;
  height?: string;
  ImageTitle?: string;
  onFilesSelected?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  replaceImages?: boolean;
  isMobile?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxSizeMB = 5,
  maxFiles = 10,
  multiple = true,
  height = "h-32",
  onFilesSelected,
  onRemove,
  ImageTitle = "Product Image",
  replaceImages = false,
  isMobile = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageItem[] = [];
    const validFileObjects: File[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size / 1024 / 1024 > maxSizeMB) {
        alert(`File ${file.name} exceeds ${maxSizeMB}MB`);
        return;
      }
      const imageItem: ImageItem = {
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      };
      newImages.push(imageItem);
      validFileObjects.push(file);
    });

    const finalImages = replaceImages ? newImages : [...images, ...newImages];
    onChange(finalImages.slice(0, maxFiles));

    const remainingSlots = Math.max(0, maxFiles - (replaceImages ? 0 : images.length));
    if (onFilesSelected && validFileObjects.length) {
      onFilesSelected(validFileObjects.slice(0, remainingSlots));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemove = (id: string) => {
    const removedIndex = images.findIndex((img) => img.id === id);
    if (removedIndex === -1) return;
    if (onRemove) onRemove(removedIndex);
  };

  return (
    <div className="space-y-4 p-6">
      {ImageTitle && <div className="mb-5 flex items-center gap-2">
        <CiImageOn className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
          {ImageTitle}
        </h2>
      </div>}

      <div
        className="flex cursor-pointer flex-col justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 py-20 text-center transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <FiUpload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-300" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
          Click to upload {multiple ? "images" : "image"} or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
          PNG, JPG or JPEG (MAX. {maxSizeMB}MB each)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Images ({images.length})
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={`group relative flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700 ${height} ${!isMobile ? "w-40" : "" // 👈 fixed width for scroll layout
                  }`}
              >
                <Image
                  src={img.url}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRemove(img.id);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity duration-200 hover:bg-red-600 group-hover:opacity-100"
                >
                  <IoMdClose className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
