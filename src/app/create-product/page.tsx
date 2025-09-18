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

interface FormLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  htmlFor,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [category, setCategory] = useState<string>("tyre");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
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

  // Load existing product when id present
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
      } catch (error: any) {
        Toast({
          message: error?.message || "Failed to load product",
          type: "error",
        });
      }
    };
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

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

  // Remove image from previews and mirror the file list
  const handleRemoveImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Basic validations
    if (!formData.name || !formData.brand) {
      Toast({ message: "Please fill required fields", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      Toast({
        message: isEdit ? "Updating product..." : "Creating product...",
        type: "loading",
        duration: 2000,
      });

      const payload = {
        name: formData.name as string,
        brand: formData.brand as string,
        category: category as string,
        description: formData.description || undefined,
        images: imageFiles,
        sku: `${(formData.brand || "").slice(0, 10)}-${Date.now().toString().slice(-6)}`,
        price: Number(formData.price || 0),
        stock: Number(formData.stock || 0),
        tyreSpecifications:
          category === "tyre" ? formData.tyreSpecifications : undefined,
        wheelSpecifications:
          category === "wheel" ? formData.wheelSpecifications : undefined,
        isActive: true,
      } as any;

      const res =
        isEdit && editId
          ? await updateProduct(editId, payload)
          : await createProduct(payload);

      console.log(res);

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
      Toast({
        message: error?.message || "Error creating product",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-white">Create Product</h1>
          </div>
          <p className="text-gray-600">
            Add a new product to your inventory with detailed specifications
          </p>
        </div>

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
                      required
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
                      required
                    />
                  </div>
                  <div>
                    <FormLabel label="Brand" required />
                    <TextField
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Enter brand name"
                      required
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
                {/* Pattern */}
                <div>
                  <Select
                    label="Pattern"
                    required
                    name="tyre.pattern"
                    value={formData.tyreSpecifications.pattern}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          pattern: value,
                        },
                      }))
                    }
                    options={pattern}
                    placeholder="Select pattern"
                  />
                </div>

                <div>
                  <Select
                    name="tyre.width"
                    label="Width"
                    required
                    value={formData.tyreSpecifications.width}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          width: value,
                        },
                      }))
                    }
                    options={width}
                    placeholder="Select width"
                  />
                </div>

                {/* Profile */}
                <div>
                  <Select
                    label="Profile"
                    required
                    name="tyre.profile"
                    value={formData.tyreSpecifications.profile}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          profile: value,
                        },
                      }))
                    }
                    options={profiles}
                    placeholder="Select profile"
                  />
                </div>

                <div>
                  <Select
                    label="Diameter"
                    required
                    name="tyre.diameter"
                    value={formData.tyreSpecifications.diameter}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          diameter: value,
                        },
                      }))
                    }
                    options={diameter}
                    placeholder="Select diameter"
                  />
                </div>

                {/* Load Rating */}
                <div>
                  <Select
                    label="Load Rating"
                    name="tyre.loadRating"
                    value={formData.tyreSpecifications.loadRating}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          loadRating: value,
                        },
                      }))
                    }
                    required
                    options={loadrating}
                    placeholder="Select load rating"
                  />
                </div>

                {/* Speed Rating */}
                <div>
                  <FormLabel label="Speed Rating" required />
                  <Select
                    name="tyre.speedRating"
                    value={formData.tyreSpecifications.speedRating}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        tyreSpecifications: {
                          ...prev.tyreSpecifications,
                          speedRating: value,
                        },
                      }))
                    }
                    options={speedrating}
                    placeholder="Select speed rating"
                  />
                </div>
              </div>
            )}

            {category === "wheel" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Size */}
                <div>
                  <Select
                    label="Size"
                    required
                    name="wheel.size"
                    value={formData.wheelSpecifications.size}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        wheelSpecifications: {
                          ...prev.wheelSpecifications,
                          size: value,
                        },
                      }))
                    }
                    options={wheelSizes} // define your wheelSizes array
                    placeholder="Select size"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                    Color <span className="text-red-500">*</span>
                  </label>
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
                    placeholder="Enter color"
                  />
                </div>
                <div>
                  <Select
                    label="Diameter"
                    required
                    name="wheel.diameter"
                    value={formData.wheelSpecifications.diameter}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        wheelSpecifications: {
                          ...prev.wheelSpecifications,
                          diameter: value,
                        },
                      }))
                    }
                    options={wheelDiameters} // define your wheelDiameters array
                    placeholder="Select diameter"
                  />
                </div>
                <div>
                  <Select
                    label="Fitments"
                    required
                    name="wheel.fitments"
                    value={formData.wheelSpecifications.fitments}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        wheelSpecifications: {
                          ...prev.wheelSpecifications,
                          fitments: value,
                        },
                      }))
                    }
                    options={wheelFitments} // define your fitmentsOptions array
                    placeholder="Select fitments"
                  />
                </div>

                {/* Staggered Options */}
                <div>
                  <Select
                    label="Staggered Options"
                    required
                    name="wheel.staggeredOptions"
                    value={formData.wheelSpecifications.staggeredOptions}
                    onChange={(value) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        wheelSpecifications: {
                          ...prev.wheelSpecifications,
                          staggeredOptions: value,
                        },
                      }))
                    }
                    options={staggeredOptions} // define your staggeredOptionsList array
                    placeholder="Select staggered option"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-lg px-8 py-3 font-semibold text-white shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? "cursor-not-allowed bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Create..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
