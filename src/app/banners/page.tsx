"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { FiImage } from "react-icons/fi";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import { createBanner, updateBanner, getBannerById } from "@/services/BannerService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";

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

  const handleLaptopFilesSelected = (files: File[]) => {
    if (!files?.length) return;
    const file = files[0];
    const imageItem = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    };
    setLaptopImages([imageItem]);
  };

  const handleMobileFilesSelected = (files: File[]) => {
    if (!files?.length) return;
    const file = files[0];
    const imageItem = {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    };
    setMobileImages([imageItem]);
  };

  const handleRemoveLaptopImage = () => setLaptopImages([]);
  const handleRemoveMobileImage = () => setMobileImages([]);

  useEffect(() => {
    const loadBanner = async () => {
      if (!editId) return;
      setIsEdit(true);
      try {
        const res = await getBannerById(editId);
        const banner = res.data;

        if (banner) {
          setIsActive(banner.isActive);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
          setLaptopImages([
            { id: crypto.randomUUID(), url: `${baseUrl}${banner.laptopImage}` },
          ]);
          setMobileImages([
            { id: crypto.randomUUID(), url: `${baseUrl}${banner.mobileImage}` },
          ]);
        }
      } catch (error: any) {
        console.error("Failed to load banner:", error);
        Toast({ message: "Failed to load banner data", type: "error" });
      }
    };

    loadBanner();
  }, [editId]);

  const validateForm = () => {
    if (!isEdit) {
      if (laptopImages.length === 0) {
        Toast({ message: "Please upload a laptop banner image", type: "error" });
        return false;
      }
      if (mobileImages.length === 0) {
        Toast({ message: "Please upload a mobile banner image", type: "error" });
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
      const payload: any = { isActive };

      if (isEdit) {
        if (laptopImages[0]?.file) payload.laptopImage = laptopImages[0].file;
        if (mobileImages[0]?.file) payload.mobileImage = mobileImages[0].file;
      } else {
        const laptopImageFile = laptopImages[0]?.file;
        const mobileImageFile = mobileImages[0]?.file;

        if (!laptopImageFile) throw new Error("Laptop image file missing");
        if (!mobileImageFile) throw new Error("Mobile image file missing");

        payload.laptopImage = laptopImageFile;
        payload.mobileImage = mobileImageFile;
      }

      let res;
      if (isEdit && editId) {
        res = await updateBanner(editId, payload);
        if (res?.statusCode === 200) {
          Toast({ message: res.message || "Banner updated successfully", type: "success" });
        }
      } else {
        res = await createBanner(payload);
        if (res?.statusCode === 201) {
          Toast({ message: res.message || "Banner created successfully", type: "success" });
          setLaptopImages([]);
          setMobileImages([]);
          setIsActive(true);
        }
      }

      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        router.push("/banners/list");
      } else {
        Toast({ message: res?.message || `Failed to ${isEdit ? "update" : "create"} banner`, type: "error" });
      }
    } catch (error: any) {
      setApiError(error?.response?.data?.errorData || "Something went wrong. Please try again");
      Toast({ message: `Failed to ${isEdit ? "update" : "create"} banner`, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
            {isEdit ? "Edit Banner" : "Add New Banner"}
          </h1>
          <p className="text-gray-400">
            {isEdit ? "Update banner images" : "Upload banner images for desktop and mobile views"}
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl bg-white p-6 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2">
              <FiImage className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                Banner Images
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <FormLabel label="Laptop/Desktop Banner" required />
                <p className="mb-3 text-sm text-gray-500">Recommended: 1200x600 px</p>
                <ImageUploader
                  images={laptopImages}
                  onChange={setLaptopImages}
                  onFilesSelected={handleLaptopFilesSelected}
                  onRemove={handleRemoveLaptopImage}
                  ImageTitle="Banner Image"
                  maxFiles={1}
                  ImageTitle="Banner Image"
                  multiple={false}
                  replaceImages
                />
              </div>
              <div>
                <FormLabel label="Mobile Banner" required />
                <p className="mb-3 text-sm text-gray-500">Recommended: 420x500 px</p>
                <ImageUploader
                  images={mobileImages}
                  onChange={setMobileImages}
                  isMobile={true}
                  onFilesSelected={handleMobileFilesSelected}
                  onRemove={handleRemoveMobileImage}
                  ImageTitle="Banner Image"
                  maxFiles={1}
                  ImageTitle="Banner Image"
                  multiple={false}
                  replaceImages
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => router.push("/banners/list")}>
              Cancel
            </Button>
            <Button variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerPage;