"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { FiPackage } from "react-icons/fi";
import { GiCarWheel } from "react-icons/gi";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "@/services/CreateProductService";
import { useRouter, useSearchParams } from "next/navigation";
import {
  diameter,
  loadrating,
  pattern,
  profiles,
  speedrating,
  staggeredOptions,
  wheelDiameters,
  wheelFitments,
  wheelSizes,
  width,
} from "./constant";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [category, setCategory] = useState<string>("tyre");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingFilenames, setExistingFilenames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    brand: "",
    price: "",
    stock: "",
    images: [],
    description: "",
    tyreSpecifications: {
      pattern: "",
      width: "",
      profile: "",
      diameter: "",
      loadRating: "",
      speedRating: "",
    },
    wheelSpecifications: {
      size: "",
      color: "",
      diameter: "",
      fitments: "",
      staggeredOptions: "",
    },
  });

  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState<string>("");

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
    }

    if (!formData.stock) {
      newErrors.stock = "Stock is required";
    }

    if (category === "tyre") {
      const tyre = formData.tyreSpecifications;
      if (!tyre.pattern) newErrors["tyre.pattern"] = "Pattern is required";
      if (!tyre.width) newErrors["tyre.width"] = "Width is required";
      if (!tyre.profile) newErrors["tyre.profile"] = "Profile is required";
      if (!tyre.diameter) newErrors["tyre.diameter"] = "Diameter is required";
      if (!tyre.loadRating)
        newErrors["tyre.loadRating"] = "Load rating is required";
      if (!tyre.speedRating)
        newErrors["tyre.speedRating"] = "Speed rating is required";
    }

    if (category === "wheel") {
      const wheel = formData.wheelSpecifications;
      if (!wheel.size) newErrors["wheel.size"] = "Size is required";
      if (!wheel.color) newErrors["wheel.color"] = "Color is required";
      if (!wheel.diameter) newErrors["wheel.diameter"] = "Diameter is required";
      if (!wheel.fitments)
        newErrors["wheel.fitments"] = "Fitments are required";
      if (!wheel.staggeredOptions)
        newErrors["wheel.staggeredOptions"] = "Staggered option is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!editId) return;
      setIsEdit(true);
      try {
        const res = await getProductById(editId);
        const product = res?.data || res;
        if (!product) throw new Error("Product not found");
        setCategory(product.category || "tyre");
        setFormData((prev: any) => ({
          ...prev,
          name: product.name || "",
          brand: product.brand || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          images: (product.images || []).map((img: string) => {
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
            return {
              id: crypto.randomUUID(),
              url: `${BASE_URL}/Product/${img}`,
            };
          }),
          description: product.description || "",
          tyreSpecifications:
            product.tyreSpecifications || prev.tyreSpecifications,
          wheelSpecifications:
            product.wheelSpecifications || prev.wheelSpecifications,
        }));
        setExistingFilenames(product.images || []);
      } catch (error: any) {
        console.log(error);
      }
    };
    loadProduct();
  }, [editId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Remove error for this field
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));

    if (name?.startsWith("tyre.")) {
      const key = name.replace("tyre.", "");
      setFormData((prev: any) => ({
        ...prev,
        tyreSpecifications: { ...prev.tyreSpecifications, [key]: value },
      }));
    } else if (name?.startsWith("wheel.")) {
      const key = name.replace("wheel.", "");
      setFormData((prev: any) => ({
        ...prev,
        wheelSpecifications: { ...prev.wheelSpecifications, [key]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Sync image file selection from ImageUploader
  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
  };

  // Remove image from previews and recompute file list based on images array
  const handleRemoveImage = (index: number) => {
    setFormData((prev: any) => {
      const newImages = prev.images.filter((_: any, i: number) => i !== index);
      const newFiles = newImages
        .filter((it: any) => it?.file)
        .map((it: any) => it.file as File);
      setImageFiles(newFiles);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      let sku = "";
      if (category === "tyre") {
        const tyre = formData.tyreSpecifications;
        sku = `${formData.brand}-${tyre.width || ""}/${tyre.profile || ""}-${tyre.pattern || ""}-${tyre.diameter || ""}-${tyre.loadRating || ""}${tyre.speedRating || ""}`;
      } else if (category === "wheel") {
        const wheel = formData.wheelSpecifications;
        sku = `${formData.brand}-${wheel.size || ""}-${wheel.diameter || ""}-${wheel.fitments || ""}`;
      } else {
        sku = `${(formData.brand || "").slice(0, 10)}-${Date.now().toString().slice(-6)}`;
      }

      // Derive keep list from current preview items that are existing (no file prop)
      const keepList: string[] = (formData.images || [])
        .filter((it: any) => !it?.file && typeof it?.url === "string")
        .map((it: any) => {
          try {
            const url: string = it.url;
            const parts = url.split("/Product/");
            return parts.length > 1 ? parts[1] : url;
          } catch {
            return it.url;
          }
        });

      const payload = {
        name: formData.name as string,
        brand: formData.brand as string,
        category: category as string,
        description: formData.description || undefined,
        images: imageFiles,
        sku,
        price: Number(formData.price || 0),
        stock: Number(formData.stock || 0),
        tyreSpecifications:
          category === "tyre" ? formData.tyreSpecifications : undefined,
        wheelSpecifications:
          category === "wheel" ? formData.wheelSpecifications : undefined,
        isActive: true,
        keepImages: isEdit ? keepList : undefined,
      } as any;

      const res =
        isEdit && editId
          ? await updateProduct(editId, payload)
          : await createProduct(payload);

      if (
        (isEdit && res?.statusCode === 200) ||
        (!isEdit && res?.statusCode === 201)
      ) {
        Toast({
          message:
            res.message || (isEdit ? "Product updated" : "Product created"),
          type: "success",
        });
        setFormData((prev: any) => ({
          ...prev,
          name: "",
          brand: "",
          price: "",
          stock: "",
          images: [],
          description: "",
          tyreSpecifications: {
            pattern: "",
            width: "",
            profile: "",
            diameter: "",
            loadRating: "",
            speedRating: "",
          },
          wheelSpecifications: {
            size: "",
            color: "",
            diameter: "",
            fitments: "",
            staggeredOptions: "",
          },
        }));
        setImageFiles([]);
        router.push("/products");
      } else {
        Toast({
          message: res?.message || "Failed to create product",
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

  const handleSelect = (field: string, value: string) => {
    // Remove error for this field
    setErrors((prev: any) => ({ ...prev, [field]: undefined }));

    // Update formData dynamically
    if (field.startsWith("tyre.")) {
      const key = field.replace("tyre.", "");
      setFormData((prev: any) => ({
        ...prev,
        tyreSpecifications: { ...prev.tyreSpecifications, [key]: value },
      }));
    } else if (field.startsWith("wheel.")) {
      const key = field.replace("wheel.", "");
      setFormData((prev: any) => ({
        ...prev,
        wheelSpecifications: { ...prev.wheelSpecifications, [key]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-white">
              Create Product
            </h1>
          </div>
          <p className="text-gray-600">
            Add a new product to your inventory with detailed specifications
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
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveImage}
              />
            </div>

            {/* Right Side - Basic Information Form */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <FormLabel label="Product Name" required />
                    <TextField
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <Select
                      label="Category"
                      name="category"
                      value={category}
                      onChange={(value) =>
                        setCategory(value as "tyre" | "wheel")
                      }
                      options={[
                        { label: "Tyre", value: "tyre" },
                        { label: "Wheel", value: "wheel" },
                      ]}
                    />
                  </div>
                  <div>
                    <FormLabel label="Brand" required />
                    <TextField
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Enter brand name"
                      error={errors.brand}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <FormLabel label="Price" required />
                      <div className="relative">
                        <TextField
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          error={errors.price}
                        />
                      </div>
                    </div>
                    <div>
                      <FormLabel label="Stock Quantity" required />
                      <TextField
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        error={errors.stock}
                      />
                    </div>
                  </div>
                  <div>
                    <FormLabel label="Description" />
                    <TextField
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Specifications Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2">
              <GiCarWheel className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {category === "tyre" ? "Tyre" : "Wheel"} Specifications
              </h2>
            </div>

            {category === "tyre" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Pattern"
                  required
                  name="tyre.pattern"
                  value={formData.tyreSpecifications.pattern}
                  onChange={(value) => handleSelect("tyre.pattern", value)}
                  error={errors["tyre.pattern"]}
                  options={pattern}
                  placeholder="Select pattern"
                />

                <Select
                  label="Width"
                  required
                  value={formData.tyreSpecifications.width}
                  onChange={(value) => handleSelect("tyre.width", value)}
                  error={errors["tyre.width"]}
                  options={width}
                  placeholder="Select width"
                />

                {/* Profile */}
                <Select
                  label="Profile"
                  required
                  value={formData.tyreSpecifications.profile}
                  onChange={(value) => handleSelect("tyre.profile", value)}
                  error={errors["tyre.profile"]}
                  options={profiles}
                  placeholder="Select profile"
                />

                <Select
                  label="Diameter"
                  required
                  value={formData.tyreSpecifications.diameter}
                  onChange={(value) => handleSelect("tyre.diameter", value)}
                  error={errors["tyre.diameter"]}
                  options={diameter}
                  placeholder="Select diameter"
                />

                <Select
                  label="Load Rating"
                  required
                  value={formData.tyreSpecifications.loadRating}
                  onChange={(value) => handleSelect("tyre.loadRating", value)}
                  error={errors["tyre.loadRating"]}
                  options={loadrating}
                  placeholder="Select load rating"
                />

                <Select
                  label="Speed Rating"
                  required
                  value={formData.tyreSpecifications.speedRating}
                  onChange={(value) => handleSelect("tyre.speedRating", value)}
                  error={errors["tyre.speedRating"]}
                  options={speedrating}
                  placeholder="Select speed rating"
                />
              </div>
            )}

            {category === "wheel" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Size"
                  required
                  name="wheel.size"
                  value={formData.wheelSpecifications.size}
                  onChange={(value) => handleSelect("wheel.size", value)}
                  error={errors["wheel.size"]}
                  options={wheelSizes}
                  placeholder="Select size"
                />

                <div>
                  <FormLabel label="Color" required />
                  <TextField
                    name="wheel.color"
                    value={formData.wheelSpecifications.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        wheelSpecifications: {
                          ...prev.wheelSpecifications,
                          color: e.target.value,
                        },
                      }))
                    }
                    error={errors["wheel.color"]}
                    placeholder="Enter color"
                  />
                </div>
                <Select
                  label="Diameter"
                  required
                  value={formData.wheelSpecifications.diameter}
                  onChange={(value) => handleSelect("wheel.diameter", value)}
                  error={errors["wheel.diameter"]}
                  options={wheelDiameters}
                  placeholder="Select diameter"
                />
                <Select
                  label="Fitments"
                  required
                  value={formData.wheelSpecifications.fitments}
                  onChange={(value) => handleSelect("wheel.fitments", value)}
                  error={errors["wheel.fitments"]}
                  options={wheelFitments}
                  placeholder="Select fitments"
                />

                <Select
                  label="Staggered Options"
                  required
                  value={formData.wheelSpecifications.staggeredOptions}
                  onChange={(value) =>
                    handleSelect("wheel.staggeredOptions", value)
                  }
                  error={errors["wheel.staggeredOptions"]}
                  options={staggeredOptions}
                  placeholder="Select staggered option"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {isEdit && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push("/products")}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary" disabled={isSubmitting}>
              {isEdit
                ? isSubmitting
                  ? "Update..."
                  : "Update Product"
                : isSubmitting
                  ? "Create..."
                  : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
