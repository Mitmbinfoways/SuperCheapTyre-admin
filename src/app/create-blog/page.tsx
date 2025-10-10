"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent, useMemo, useRef } from "react";
import { FiFileText, FiImage, FiLayout, FiTag } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import {
  createBlog,
  getBlogById,
  updateBlog,
  BlogPayload,
  UpdateBlogPayload
} from "@/services/BlogService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/Toggle";
import Select from "@/components/ui/Select";

interface BlogItem {
  image: File | null;
  existingImageUrl: string | null;
  content: string;
}

const CreateBlogPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [format, setFormat] = useState<"carousel" | "alternative" | "card" | "center">("carousel");
  
  // Form data for all formats
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    tagInput: "",
    isActive: true, // Set to true by default
  });
  
  // Carousel format data
  const [carouselImages, setCarouselImages] = useState<File[]>([]);
  const [existingCarouselImages, setExistingCarouselImages] = useState<string[]>([]);

  // Card/Alternative/Center format data
  const [items, setItems] = useState<BlogItem[]>([{ image: null, existingImageUrl: null, content: "" }]);
  
  // Ref to store object URLs for cleanup
  const objectUrlsRef = useRef<Record<number, string>>({});
  
  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState<string>("");

  // Create a map of object URLs for File objects to avoid recreating them on every render
  const itemImageUrls = useMemo(() => {
    const urls: Record<number, string> = {};
    items.forEach((item, index) => {
      if (item.image && item.image instanceof File) {
        // Check if we already have a URL for this file
        if (objectUrlsRef.current[index]) {
          urls[index] = objectUrlsRef.current[index];
        } else {
          // Create a new URL and store it
          const url = URL.createObjectURL(item.image);
          objectUrlsRef.current[index] = url;
          urls[index] = url;
        }
      }
    });
    return urls;
  }, [items]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all object URLs to prevent memory leaks
      Object.values(objectUrlsRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Load blog data for editing
  useEffect(() => {
    const loadBlog = async () => {
      if (!editId) return;
      setIsEdit(true);
      try {
        const res = await getBlogById(editId);
        const blog = res?.data || res;
        if (!blog) throw new Error("Blog not found");
        
        // Handle tags - could be array or string
        let tagsArray: string[] = [];
        if (Array.isArray(blog.tags)) {
          tagsArray = blog.tags;
        } else if (typeof blog.tags === 'string') {
          // If it's a string, split by comma
          tagsArray = (blog.tags as string).split(',').map((tag: string) => tag.trim());
        }
        
        setFormat(blog.formate as any);
        setFormData({
          title: blog.title || "",
          content: blog.content || "",
          tags: tagsArray,
          tagInput: "",
          isActive: blog.isActive,
        });
        
        // For carousel format, show existing images as previews
        if (blog.formate === "carousel" && blog.images && blog.images.length > 0) {
          // We'll store the existing image URLs for preview purposes
          setExistingCarouselImages(blog.images);
        } else if (blog.formate !== "carousel" && blog.items && blog.items.length > 0) {
          // For card/alternative/center formats, preload items with existing image URLs
          setItems(blog.items.map((item: any) => ({
            image: null, // We don't preload actual files, but we can show previews
            existingImageUrl: item.image ? `${process.env.NEXT_PUBLIC_API_URL}/${item.image}` : null,
            content: item.content || ""
          })));
        }
      } catch (error: any) {
        console.log(error);
      }
    };
    loadBlog();
  }, [editId]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Blog title is required";
    }

    if (format === "carousel" && carouselImages.length === 0 && !isEdit) {
      newErrors.images = "At least one image is required for carousel format";
    }

    if (format !== "carousel" && items.some(item => !item.content.trim())) {
      newErrors.items = "All item content fields are required";
    }

    if (format !== "carousel" && items.some(item => !item.image && !item.existingImageUrl)) {
      newErrors.items = "All item images are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, tagInput: e.target.value }));
  };


  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, formData.tagInput.trim()],
        tagInput: ""
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // Add new files to the existing carousel images without removing existing ones
    setCarouselImages(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    console.log("Removing image at index:", index)
    setCarouselImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BlogItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // If we're changing the image, we might need to update the existingImageUrl
      if (field === "image" && value === null) {
        newItems[index].existingImageUrl = null;
        
        // Clean up the object URL if it exists
        if (prev[index].image && prev[index].image instanceof File && objectUrlsRef.current[index]) {
          URL.revokeObjectURL(objectUrlsRef.current[index]);
          delete objectUrlsRef.current[index];
        }
      }
      
      // If we're setting a new image file, clear the existingImageUrl
      if (field === "image" && value instanceof File) {
        newItems[index].existingImageUrl = null;
        
        // Clean up the previous object URL if it exists
        if (prev[index].image && prev[index].image instanceof File && objectUrlsRef.current[index]) {
          URL.revokeObjectURL(objectUrlsRef.current[index]);
          delete objectUrlsRef.current[index];
        }
      }
      
      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { image: null, existingImageUrl: null, content: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => {
      // Clean up the object URL if it exists
      if (prev[index].image && prev[index].image instanceof File && objectUrlsRef.current[index]) {
        URL.revokeObjectURL(objectUrlsRef.current[index]);
        delete objectUrlsRef.current[index];
      }
      
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleItemFilesSelected = (index: number, files: File[]) => {
    if (!files || files.length === 0) return;
    
    // When a new file is selected, we need to update both the image and clear the existingImageUrl
    setItems(prev => {
      const newItems = [...prev];
      
      // Clean up the previous object URL if it exists
      if (newItems[index].image && newItems[index].image instanceof File && objectUrlsRef.current[index]) {
        URL.revokeObjectURL(objectUrlsRef.current[index]);
        delete objectUrlsRef.current[index];
      }
      
      newItems[index] = { 
        ...newItems[index], 
        image: files[0],
        existingImageUrl: null // Clear the existing image URL when a new image is selected
      };
      return newItems;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      let payload: BlogPayload | UpdateBlogPayload = {
        title: formData.title,
        formate: format,
        isActive: true, // Always set to true
        tags: formData.tags,
      };

      if (format === "carousel") {
        (payload as BlogPayload).content = formData.content;

        (payload as BlogPayload).images = carouselImages;

      } else {
        
        (payload as BlogPayload).items = items.map(item => ({
          content: item.content,
          image: item.image instanceof File 
            ? item.image  // Pass the actual File object
            : item.existingImageUrl 
              ? item.existingImageUrl.replace(`${process.env.NEXT_PUBLIC_API_URL}/`, '')
              : "placeholder.jpg"
        }));
      }

      const res =
        isEdit && editId
          ? await updateBlog(editId, payload as UpdateBlogPayload)
          : await createBlog(payload as BlogPayload);

      if (
        (isEdit && res?.statusCode === 200) ||
        (!isEdit && res?.statusCode === 201)
      ) {
        Toast({
          message:
            res.message || (isEdit ? "Blog updated" : "Blog created"),
          type: "success",
        });
        
        router.push("/blog");
      } else {
        Toast({
          message: res?.message || "Failed to create blog",
          type: "error",
        });
      }
    } catch (error: any) {
      setApiError(
        error?.response?.data?.errorData ||
          "Something went wrong. Please try again",
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format options for the select dropdown
  const formatOptions = [
    { label: "Carousel", value: "carousel" },
    { label: "Alternative", value: "alternative" },
    { label: "Card", value: "card" },
    { label: "Center", value: "center" },
  ];

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
              {isEdit ? "Edit Blog" : "Create Blog"}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? "Edit an existing blog" : "Create a new blog post with different formats"}
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Format Selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2">
              <FiLayout className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                Blog Format
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {formatOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormat(option.value as any)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    format === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      format === option.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {format === option.value && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2">
              <FiFileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <FormLabel label="Blog Title" required />
                <TextField
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter blog title"
                  error={errors.title}
                />
              </div>
            </div>
          </div>

          {/* Format-specific Content */}
          {format === "carousel" ? (
            // Carousel Format
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-6 flex items-center gap-2">
                <FiImage className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                  Carousel Content
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <FormLabel label="Carousel Images" required />
                  <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    Select multiple images for your carousel. You can add images one at a time or select multiple at once.
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <ImageUploader
                      images={[
                        // Show existing images first
                        ...existingCarouselImages.map((img, index) => ({
                          id: `existing-${index}`,
                          url: `${process.env.NEXT_PUBLIC_API_URL}/${img}`
                        })),
                        // Then show newly uploaded images
                        ...carouselImages.map((file, index) => ({
                          id: `new-${index}`,
                          url: URL.createObjectURL(file)
                        }))
                      ]}
                      onChange={(images) => {
                        const currentImageIds = images.map(img => img.id);
                             
                        const updatedFiles = carouselImages.filter((_, index) => {
                          const imageId = `new-${index}`;
                          return currentImageIds.includes(imageId);
                        });
                        
                        setCarouselImages(updatedFiles);
                      }}
                      onFilesSelected={handleFilesSelected}
                      onRemove={(index) => {
                        if (index < existingCarouselImages.length) {
                          setExistingCarouselImages(prev => prev.filter((_, i) => i !== index));
                          console.log(`Removing existing image at index: ${index}`,existingCarouselImages);

                        } else {
                          const newImageIndex = index - existingCarouselImages.length;
                          handleRemoveImage(newImageIndex);
                          console.log(`Removing new image at index: ${newImageIndex}`);
                        } 
                      }}
                      multiple={true}
                      maxFiles={10}
                      height="h-40"
                    />
                  </div>
                  {errors.images && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.images}
                    </p>
                  )}
                  {(existingCarouselImages.length > 0 || carouselImages.length > 0) && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {existingCarouselImages.length + carouselImages.length} image(s) selected
                    </div>
                  )}
                </div>
                
                <div>
                  <FormLabel label="Content" />
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter blog content"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Card/Alternative/Center Format
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiImage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                    {format.charAt(0).toUpperCase() + format.slice(1)} Items
                  </h2>
                </div>
                <Button type="button" variant="secondary" onClick={handleAddItem}>
                  Add Item
                </Button>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Item {index + 1}
                      </h3>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <FormLabel label="Image" required />
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                          <ImageUploader
                            images={
                              items[index].image && items[index].image instanceof File
                                ? [{ id: `new-${index}`, url: itemImageUrls[index] }]
                                : items[index].existingImageUrl
                                ? [{ id: `existing-${index}`, url: items[index].existingImageUrl }]
                                : []
                            }
                            onChange={(images) => {
                              if (images.length === 0) {
                                handleItemChange(index, "image", null);
                                handleItemChange(index, "existingImageUrl", null);
                              } else {
                                // When there are images, it means a new image was uploaded
                                // We don't need to do anything here as onFilesSelected already handles this
                              }
                            }}
                            onFilesSelected={(files) => handleItemFilesSelected(index, files)}
                            onRemove={() => {
                              handleItemChange(index, "image", null);
                              handleItemChange(index, "existingImageUrl", null);
                            }}
                            multiple={false}
                            maxFiles={1}
                            height="h-40"
                            replaceImages={true}
                          />
                        </div>
                        {errors.items && !items[index].image && !items[index].existingImageUrl && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Image is required
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <FormLabel label="Content" required />
                        <textarea
                          name={`item-content-${index}`}
                          value={item.content}
                          onChange={(e) => handleItemChange(index, "content", e.target.value)}
                          placeholder="Enter item content"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          rows={4}
                        />
                        {errors.items && !item.content.trim() && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Content is required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2">
              <FiTag className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                Tags
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <FormLabel label="Add Tags" />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="tagInput"
                    value={formData.tagInput}
                    onChange={handleTagInputChange}
                    placeholder="Enter a tag"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                  <Button type="button" variant="secondary" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
              </div>
              
              {formData.tags.length > 0 && (
                <div>
                  <FormLabel label="Current Tags" />
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {isEdit && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push("/blog")}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary" disabled={isSubmitting}>
              {isEdit
                ? isSubmitting
                  ? "Update..."
                  : "Update Blog"
                : isSubmitting
                  ? "Create..."
                  : "Create Blog"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlogPage;