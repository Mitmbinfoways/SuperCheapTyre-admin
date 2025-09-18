"use client";

import React, { useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxSizeMB?: number;
  maxFiles?: number;
  multiple?: boolean;
  height?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxSizeMB = 5,
  maxFiles = 10,
  multiple = true,
  height = "h-32",
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const validFiles: string[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size / 1024 / 1024 > maxSizeMB) {
        alert(`File ${file.name} exceeds ${maxSizeMB}MB`);
        return;
      }
      validFiles.push(URL.createObjectURL(file));
    });

    onChange([...images, ...validFiles].slice(0, maxFiles));
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

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CiImageOn className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Product Images</h2>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-6 py-12 text-center flex flex-col justify-center cursor-pointer transition hover:bg-gray-50 bg-gray-50"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <FiUpload className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500 mt-2">
          Click to upload {multiple ? "images" : "image"} or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">
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

      {/* Image Preview */}
      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Uploaded Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((img, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${height}`}
              >
                <img
                  src={img}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
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
