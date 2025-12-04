"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
} from "react";
import { FiFileText, FiImage, FiLayout, FiTag, FiTrash2 } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import {
  createBlog,
  getBlogById,
  updateBlog,
  BlogPayload,
  UpdateBlogPayload,
} from "@/services/BlogService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import TextEditor from "@/components/ui/TextEditor";

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
  const [format, setFormat] = useState<
    "carousel" | "alternative" | "card" | "center"
  >("carousel");

  // Form data for all formats
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    tagInput: "",
    isActive: true,
  });

  // Carousel format data
  const [carouselImages, setCarouselImages] = useState<File[]>([]);
  const [existingCarouselImages, setExistingCarouselImages] = useState<
    string[]
  >([]);

  // Card/Alternative/Center format data
  const [items, setItems] = useState<BlogItem[]>([
    { image: null, existingImageUrl: null, content: "" },
  ]);

  // Ref to store object URLs for cleanup
  const objectUrlsRef = useRef<Record<number, string>>({});

  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState<string>("");

  // Create a map of object URLs for File objects
  const itemImageUrls = useMemo(() => {
    const urls: Record<number, string> = {};
    items.forEach((item, index) => {
      if (item.image && item.image instanceof File) {
        if (objectUrlsRef.current[index]) {
          urls[index] = objectUrlsRef.current[index];
        } else {
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
    const urlsToRevoke = Object.values(objectUrlsRef.current);
    return () => {
      urlsToRevoke.forEach((url) => {
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

        let tagsArray: string[] = [];
        if (Array.isArray(blog.tags)) {
          tagsArray = blog.tags;
        } else if (typeof blog.tags === "string") {
          tagsArray = (blog.tags as string)
            .split(",")
            .map((tag: string) => tag.trim());
        }

        setFormat(blog.formate as any);
        setFormData({
          title: blog.title || "",
          content: blog.content || "",
          tags: tagsArray,
          tagInput: "",
          isActive: blog.isActive,
        });

        if (
          blog.formate === "carousel" &&
          blog.images &&
          blog.images.length > 0
        ) {
          setExistingCarouselImages(blog.images);
        } else if (
          blog.formate !== "carousel" &&
          blog.items &&
          blog.items.length > 0
        ) {
          setItems(
            blog.items.map((item: any) => ({
              image: null,
              existingImageUrl: item.image
                ? `${process.env.NEXT_PUBLIC_API_URL}/${item.image}`
                : null,
              content: item.content || "",
            })),
          );
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

    if (
      format === "carousel" &&
      carouselImages.length === 0 &&
      existingCarouselImages.length === 0 &&
      !isEdit
    ) {
      newErrors.images = "At least one image is required for carousel format";
    }

    if (format !== "carousel" && items.some((item) => !item.content.trim())) {
      newErrors.items = "All item content fields are required";
    }

    if (
      format !== "carousel" &&
      items.some((item) => !item.image && !item.existingImageUrl)
    ) {
      newErrors.items = "All item images are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, tagInput: e.target.value }));
  };

  const handleAddTag = () => {
    if (
      formData.tagInput.trim() &&
      !formData.tags.includes(formData.tagInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, formData.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    setCarouselImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setCarouselImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof BlogItem,
    value: any,
  ) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === "image" && value === null) {
        newItems[index].existingImageUrl = null;

        if (
          prev[index].image &&
          prev[index].image instanceof File &&
          objectUrlsRef.current[index]
        ) {
          URL.revokeObjectURL(objectUrlsRef.current[index]);
          delete objectUrlsRef.current[index];
        }
      }

      if (field === "image" && value instanceof File) {
        newItems[index].existingImageUrl = null;

        if (
          prev[index].image &&
          prev[index].image instanceof File &&
          objectUrlsRef.current[index]
        ) {
          URL.revokeObjectURL(objectUrlsRef.current[index]);
          delete objectUrlsRef.current[index];
        }
      }

      return newItems;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { image: null, existingImageUrl: null, content: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      if (
        prev[index].image &&
        prev[index].image instanceof File &&
        objectUrlsRef.current[index]
      ) {
        URL.revokeObjectURL(objectUrlsRef.current[index]);
        delete objectUrlsRef.current[index];
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleItemFilesSelected = (index: number, files: File[]) => {
    if (!files || files.length === 0) return;
    setItems((prev) => {
      const newItems = [...prev];
      if (
        newItems[index].image &&
        newItems[index].image instanceof File &&
        objectUrlsRef.current[index]
      ) {
        URL.revokeObjectURL(objectUrlsRef.current[index]);
        delete objectUrlsRef.current[index];
      }
      newItems[index] = {
        ...newItems[index],
        image: files[0],
        existingImageUrl: null,
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
        isActive: true,
        tags: formData.tags,
      };

      if (format === "carousel") {
        (payload as BlogPayload).content = formData.content;
        (payload as BlogPayload).images = carouselImages;

        // For edit mode, send existing images that should be kept
        if (isEdit && existingCarouselImages.length > 0) {
          (payload as UpdateBlogPayload).existingImages = existingCarouselImages;
        }
      } else {
        // For card/alternative/center formats
        (payload as BlogPayload).items = items.map((item) => {
          if (item.image instanceof File) {
            // New image uploaded
            return {
              content: item.content,
              image: item.image,
            };
          } else if (item.existingImageUrl) {
            // Keep existing image
            return {
              content: item.content,
              image: item.existingImageUrl.replace(
                `${process.env.NEXT_PUBLIC_API_URL}/`,
                "",
              ),
            };
          } else {
            // Fallback
            return {
              content: item.content,
              image: "new_upload", // This will be handled by backend
            };
          }
        });
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
          message: res.message || (isEdit ? "Blog updated" : "Blog created"),
          type: "success",
        });

        router.push("/admin/blog");
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
              {isEdit ? "Edit Blog" : "Create New Blog"}
            </h1>
          </div>
          <p className="text-gray-400">
            {isEdit
              ? "Edit an existing blog"
              : "Create a new blog post with different formats"}
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
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${format === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${format === option.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                        }`}
                    >
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter blog title"
                  error={errors.title}
                />
              </div>
            </div>
          </div>

          {/* Format-specific Content */}
          {format === "carousel" ? (
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
                    Select multiple images for your carousel. You can add images
                    one at a time or select multiple at once.
                  </div>
                  <div className="mb-3 text-sm text-gray-500">Recommended: 1200×600px (landscape)</div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <ImageUploader
                      images={[
                        ...existingCarouselImages.map((img, index) => ({
                          id: `existing-${index}`,
                          url: `${process.env.NEXT_PUBLIC_API_URL}/${img}`,
                        })),
                        ...carouselImages.map((file, index) => ({
                          id: `new-${index}`,
                          url: URL.createObjectURL(file),
                        })),
                      ]}
                      ImageTitle="Image"
                      onChange={(images) => {
                        const currentImageIds = images.map((img) => img.id);

                        // Update existing carousel images
                        const updatedExistingImages = existingCarouselImages.filter(
                          (_, index) => {
                            const imageId = `existing-${index}`;
                            return currentImageIds.includes(imageId);
                          },
                        );
                        setExistingCarouselImages(updatedExistingImages);

                        // Update new carousel images
                        const updatedFiles = carouselImages.filter((_, index) => {
                          const imageId = `new-${index}`;
                          return currentImageIds.includes(imageId);
                        });
                        setCarouselImages(updatedFiles);
                      }}
                      onFilesSelected={handleFilesSelected}
                      onRemove={(index) => {
                        if (index < existingCarouselImages.length) {
                          setExistingCarouselImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        } else {
                          const newImageIndex =
                            index - existingCarouselImages.length;
                          handleRemoveImage(newImageIndex);
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
                  {(existingCarouselImages.length > 0 ||
                    carouselImages.length > 0) && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {existingCarouselImages.length + carouselImages.length}{" "}
                        image(s) selected
                      </div>
                    )}
                </div>
                <div>
                  <FormLabel label="Content" />
                  <TextEditor
                    value={formData.content}
                    onChange={(content) =>
                      setFormData((prev) => ({
                        ...prev,
                        content,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiImage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                    {format.charAt(0).toUpperCase() + format.slice(1)} Items
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Blog Item {index + 1}
                      </h3>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <FormLabel label="Image" required />
                        <div className="mb-3 text-sm text-gray-500">Recommended: 800×600px (landscape)</div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                          <ImageUploader
                            images={
                              items[index].image &&
                                items[index].image instanceof File
                                ? [
                                  {
                                    id: `new-${index}`,
                                    url: itemImageUrls[index],
                                  },
                                ]
                                : items[index].existingImageUrl
                                  ? [
                                    {
                                      id: `existing-${index}`,
                                      url: items[index].existingImageUrl,
                                    },
                                  ]
                                  : []
                            }
                            ImageTitle="Image"
                            onChange={(images) => {
                              if (images.length === 0) {
                                handleItemChange(index, "image", null);
                                handleItemChange(
                                  index,
                                  "existingImageUrl",
                                  null,
                                );
                              }
                            }}
                            onFilesSelected={(files) =>
                              handleItemFilesSelected(index, files)
                            }
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
                        {errors.items &&
                          !items[index].image &&
                          !items[index].existingImageUrl && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              Image is required
                            </p>
                          )}
                      </div>

                      <div>
                        <FormLabel label="Content" required />
                        <TextEditor
                          value={item.content}
                          onChange={(content) =>
                            handleItemChange(index, "content", content)
                          }
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
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddTag}
                    disabled={formData.tagInput.trim().length === 0}
                  >
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
                onClick={() => router.push("/admin/blog")}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary">
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