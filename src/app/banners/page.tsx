"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { FiImage } from "react-icons/fi";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import { createBanner, updateBanner, getBannerById } from "@/services/BannerService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/Toggle";

const BannerPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  
  const [laptopImages, setLaptopImages] = useState<any[]>([]);
  const [mobileImages, setMobileImages] = useState<any[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [isEdit, setIsEdit] = useState<boolean>(false);

  // Handle laptop image selection
  const handleLaptopFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    // Only allow one laptop image
    const file = files[0];
    const imageItem = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    };
    setLaptopImages([imageItem]);
  };

  // Handle mobile image selection
  const handleMobileFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    // Only allow one mobile image
    const file = files[0];
    const imageItem = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    };
    setMobileImages([imageItem]);
  };

  // Remove laptop image
  const handleRemoveLaptopImage = () => {
    setLaptopImages([]);
  };

  // Remove mobile image
  const handleRemoveMobileImage = () => {
    setMobileImages([]);
  };

  // Load banner data for editing
  useEffect(() => {
    const loadBanner = async () => {
      if (!editId) return;
      setIsEdit(true);
      try {
        const res = await getBannerById(editId);
        const banner = res.data;
        
        if (banner) {
          setIsActive(banner.isActive);
          
          // Set existing images
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
          setLaptopImages([
            {
              id: crypto.randomUUID(),
              url: `${baseUrl}${banner.laptopImage}`,
            },
          ]);
          setMobileImages([
            {
              id: crypto.randomUUID(),
              url: `${baseUrl}${banner.mobileImage}`,
            },
          ]);
        }
      } catch (error: any) {
        console.error("Failed to load banner:", error);
        Toast({
          message: "Failed to load banner data",
          type: "error",
        });
      }
    };
    
    loadBanner();
  }, [editId]);

  const validateForm = () => {
    // For editing, we don't require new images as they might not be changed
    if (!isEdit) {
      if (laptopImages.length === 0) {
        Toast({
          message: "Please upload a laptop banner image",
          type: "error",
        });
        return false;
      }

      if (mobileImages.length === 0) {
        Toast({
          message: "Please upload a mobile banner image",
          type: "error",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      const payload: any = {
        isActive,
      };

      // For editing, only include files if they are new (have file property)
      // For creation, always include the files
      if (isEdit) {
        if (laptopImages[0]?.file) {
          payload.laptopImage = laptopImages[0].file;
        }
        
        if (mobileImages[0]?.file) {
          payload.mobileImage = mobileImages[0].file;
        }
      } else {
        // For creation, we must have files
        const laptopImageFile = laptopImages[0]?.file;
        const mobileImageFile = mobileImages[0]?.file;

        if (!laptopImageFile) {
          Toast({
            message: "Please upload a laptop banner image",
            type: "error",
          });
          throw new Error("Laptop image file is missing");
        }
        
        if (!mobileImageFile) {
          Toast({
            message: "Please upload a mobile banner image",
            type: "error",
          });
          throw new Error("Mobile image file is missing");
        }

        payload.laptopImage = laptopImageFile;
        payload.mobileImage = mobileImageFile;
      }

      let res;
      if (isEdit && editId) {
        // Update existing banner
        res = await updateBanner(editId, payload);
        if (res?.statusCode === 200) {
          Toast({
            message: res.message || "Banner updated successfully",
            type: "success",
          });
        }
      } else {
        // Create new banner
        res = await createBanner(payload);
        
        if (res?.statusCode === 201) {
          Toast({
            message: res.message || "Banner created successfully",
            type: "success",
          });
          
          // Reset form
          setLaptopImages([]);
          setMobileImages([]);
          setIsActive(true);
        }
      }
      
      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        // Redirect to banners list
        router.push("/banners/list");
      } else {
        Toast({
          message: res?.message || `Failed to ${isEdit ? 'update' : 'create'} banner`,
          type: "error",
        });
      }
    } catch (error: any) {
      setApiError(
        error?.response?.data?.message ||
        `Something went wrong. Please try again`,
      );
      console.error(error);
      Toast({
        message: `Failed to ${isEdit ? 'update' : 'create'} banner`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
              {isEdit ? "Edit Banner" : "Create Banner"}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit 
              ? "Update banner images and settings" 
              : "Upload banner images for desktop and mobile views"}
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col gap-6 rounded-xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex-row">
            {/* Left Side - Image Uploaders */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiImage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                    Banner Images
                  </h2>
                </div>

                <div className="space-y-8">
                  {/* Laptop Banner */}
                  <div>
                    <FormLabel label="Laptop/Desktop Banner" required />
                    <p className="mb-3 text-sm text-gray-500">
                      Recommended size: 1200x400 pixels
                    </p>
                    <ImageUploader
                      images={laptopImages}
                      onChange={setLaptopImages}
                      onFilesSelected={handleLaptopFilesSelected}
                      onRemove={handleRemoveLaptopImage}
                      maxFiles={1}
                      multiple={false}
                      replaceImages={true}
                    />
                  </div>

                  {/* Mobile Banner */}
                  <div>
                    <FormLabel label="Mobile Banner" required />
                    <p className="mb-3 text-sm text-gray-500">
                      Recommended size: 600x400 pixels
                    </p>
                    <ImageUploader
                      images={mobileImages}
                      onChange={setMobileImages}
                      onFilesSelected={handleMobileFilesSelected}
                      onRemove={handleRemoveMobileImage}
                      maxFiles={1}
                      multiple={false}
                      replaceImages={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Settings */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiImage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                    Banner Settings
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <FormLabel label="Active Status" />
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-300">
                          Make Banner Active
                        </h3>
                        <p className="text-sm text-gray-500">
                          Active banners will be displayed on the website
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push("/banners/list")}
            >
              Cancel
            </Button>
            <Button variant="primary" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEdit ? "Updating..." : "Creating...") 
                : (isEdit ? "Update Banner" : "Create Banner")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerPage;