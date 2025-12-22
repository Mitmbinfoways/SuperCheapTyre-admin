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
import Select from "@/components/ui/Select";
import { useScrollToError } from "@/hooks/useScrollToError";

const CreateBrandPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const returnPage = searchParams.get("page");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    category: "",
    isActive: true,
    images: [],
  });

  const [errors, setErrors] = useState<any>({});
  useScrollToError(errors);
  const [apiError, setApiError] = useState<string>("");

  const categoryOptions = [
    { label: "Tyre", value: "tyre" },
    { label: "Wheel", value: "wheel" },
    { label: "Tyre & Wheel", value: "both" },
  ];

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Brand name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
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
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
        setFormData({
          name: brand.name || "",
          category: brand.category || "",
          isActive: brand.isActive,
          images: brand.image
            ? [
              {
                id: "brand-image",
                url: `${BASE_URL}/Brand/${brand.image}`,
              },
            ]
            : [],
        });
      } catch (error: any) {
        console.error(error);
        Toast({
          message: "Failed to load brand",
          type: "error",
        });
      }
    };
    loadBrand();
  }, [editId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    setImageFile(files[0]);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setFormData((prev: any) => ({ ...prev, images: [] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
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
          message: res.message || (isEdit ? "Brand updated" : "Brand created"),
          type: "success",
        });

        setFormData({
          name: "",
          category: "",
          isActive: true,
          images: [],
        });
        setImageFile(null);
        if (returnPage) {
          router.push(`/admin/brands?page=${returnPage}`);
        } else {
          router.push("/admin/brands");
        }
      } else {
        Toast({
          message: res?.message || "Failed to create brand",
          type: "error",
        });
      }
    } catch (error: any) {
      setApiError(
        error?.response?.data?.errorData ||
        "Something went wrong. Please try again."
      );
      console.error(error);
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
              {isEdit ? "Edit Brand" : "Create New Brand"}
            </h1>
          </div>
          <p className="text-gray-400">
            {isEdit
              ? "Edit an existing brand"
              : "Add a new brand to your inventory"}
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
                images={formData.images}
                onChange={(images) =>
                  setFormData((prev: any) => ({ ...prev, images }))
                }
                ImageTitle="Brand Image"
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveImage}
                maxFiles={1}
                multiple={false}
                replaceImages={true}
                ImageRatio="Recommended: Use 16:9 aspect ratio"
              />
            </div>

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
                  <div>
                    <FormLabel label="Category" required />
                    <Select
                      name="category"
                      options={categoryOptions}
                      value={formData.category}
                      onChange={(value) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                      placeholder="Select category"
                      error={errors.category}
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
                onClick={() => {
                  if (returnPage) {
                    router.push(`/admin/brands?page=${returnPage}`);
                  } else {
                    router.push("/admin/brands");
                  }
                }}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary">
              {isEdit
                ? isSubmitting
                  ? "Updating..."
                  : "Update Brand"
                : isSubmitting
                  ? "Creating..."
                  : "Create Brand"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBrandPage;