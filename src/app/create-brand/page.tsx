"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { FiPackage } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import {
  createBrand,
  getBrandById,
  updateBrand,
} from "@/services/BrandService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/Toggle";

const CreateBrandPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    isActive: true,
    image: null,
  });

  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState<string>("");

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Brand name is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const loadBrand = async () => {
      if (!editId) return;
      setIsEdit(true);
      try {
        const res = await getBrandById(editId);
        const brand = res?.data || res;
        if (!brand) throw new Error("Brand not found");
        setFormData((prev: any) => ({
          ...prev,
          name: brand.name || "",
          isActive: brand.isActive,
        }));
      } catch (error: any) {
        console.log(error);
      }
    };
    loadBrand();
  }, [editId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    // Remove error for this field
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Sync image file selection from ImageUploader
  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    setImageFile(files[0]);
    setFormData((prev: any) => ({ ...prev, image: files[0] }));
  };

  // Remove image from previews and recompute file list based on images array
  const handleRemoveImage = () => {
    setImageFile(null);
    setFormData((prev: any) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name as string,
        isActive: formData.isActive,
        image: imageFile || undefined,
      };

      const res =
        isEdit && editId
          ? await updateBrand(editId, payload)
          : await createBrand(payload);

      if (
        (isEdit && res?.statusCode === 200) ||
        (!isEdit && res?.statusCode === 201)
      ) {
        Toast({
          message:
            res.message || (isEdit ? "Brand updated" : "Brand created"),
          type: "success",
        });
        setFormData((prev: any) => ({
          ...prev,
          name: "",
          isActive: true,
          image: null,
        }));
        setImageFile(null);
        router.push("/brands");
      } else {
        Toast({
          message: res?.message || "Failed to create brand",
          type: "error",
        });
      }
    } catch (error: any) {
      setApiError(
        error?.response?.data?.errorData ||
          "Something went wrong Please try again",
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare images for ImageUploader component
  const prepareImages = () => {
    if (formData.image && imageFile) {
      return [{
        id: 'brand-image',
        url: URL.createObjectURL(imageFile)
      }];
    }
    return [];
  };

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
              {isEdit ? "Edit Brand" : "Create Brand"}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEdit ? "Edit an existing brand" : "Add a new brand to your inventory"}
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col gap-6 rounded-xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex-row">
            <div className="flex-1">
              <ImageUploader
                images={prepareImages()}
                onChange={(images) => {
                  if (images.length === 0) {
                    handleRemoveImage();
                  }
                }}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveImage}
                maxFiles={1}
                multiple={false}
              />
            </div>

            {/* Right Side - Basic Information Form */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                    Brand Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <FormLabel label="Brand Name" required />
                    <TextField
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter brand name"
                      error={errors.name}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <FormLabel label="Active" />
                    <ToggleSwitch
                      checked={formData.isActive}
                      onChange={(checked) => 
                        setFormData((prev: any) => ({ ...prev, isActive: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {isEdit && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push("/brands")}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary" disabled={isSubmitting}>
              {isEdit
                ? isSubmitting
                  ? "Update..."
                  : "Update Brand"
                : isSubmitting
                  ? "Create..."
                  : "Create Brand"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBrandPage;