"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { FiPackage } from "react-icons/fi";
import { GiCarWheel } from "react-icons/gi";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import ImageUploader from "@/components/ui/ImageUpload";
import { Toast } from "@/components/ui/Toast";
import TextEditor from "@/components/ui/TextEditor";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "@/services/CreateProductService";
import { getAllBrands } from "@/services/BrandService";
import { useRouter, useSearchParams } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/Toggle";
import { getAllMasterFilters, MasterFilter, createMasterFilter } from "@/services/MasterFilterService";
import { v4 as uuidv4 } from "uuid";
import { useScrollToError } from "@/hooks/useScrollToError";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [category, setCategory] = useState<string>("tyre");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  // const [existingFilenames, setExistingFilenames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [brands, setBrands] = useState<{ label: string; value: string }[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    brand: "",
    price: "",
    stock: "",
    images: [],
    pricetext: "",
    description: "",
    isPopular: false,
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
  useScrollToError(errors);
  const [apiError, setApiError] = useState<string>("");
  const [filterOptions, setFilterOptions] = useState<MasterFilter[]>([]);

  // Fetch brands when component mounts
  const fetchBrands = async (selectedCategory: string) => {
    setLoadingBrands(true);
    try {
      const res = await getAllBrands();
      const brandOptions = res.data.items
        .filter((brand) => brand.isActive && (brand.category === selectedCategory || brand.category === "both"))
        .map((brand) => ({
          label: brand.name,
          value: brand.name,
        }));
      setBrands(brandOptions);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      Toast({
        message: "Failed to load brands",
        type: "error",
      });
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchBrands(category);
  }, [category]);

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
          pricetext: product.pricetext || "",
          stock: product.stock ?? "",
          images: (product.images || []).map((img: string) => {
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
            return {
              id: uuidv4(),
              url: `${BASE_URL}/Product/${img}`,
            };
          }),
          isPopular: product.isPopular || false,
          description: product.description || "",
          tyreSpecifications: {
            ...prev.tyreSpecifications,
            ...(product.tyreSpecifications || {}),
          },
          wheelSpecifications: {
            ...prev.wheelSpecifications,
            ...(product.wheelSpecifications || {}),
            staggeredOptions:
              product.wheelSpecifications?.staggeredOptions ||
              (product.wheelSpecifications as any)?.staggeredOption ||
              "",
          },
        }));
        // setExistingFilenames(product.images || []);
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

  // Handle description change specifically for TextEditor
  const handleDescriptionChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, description: value }));
    setErrors((prev: any) => ({ ...prev, description: undefined }));
  };

  // Handle brand selection
  const handleBrandChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, brand: value }));
    setErrors((prev: any) => ({ ...prev, brand: undefined }));
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
        sku = `${formData.brand}-${wheel.size || ""}-${wheel.color || ""}-${wheel.diameter || ""}-${wheel.fitments || ""}-${wheel.staggeredOptions || ""}`;
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
        pricetext: formData.pricetext || "",
        sku,
        price: Number(formData.price || 0),
        stock: Number(formData.stock || 0),
        tyreSpecifications:
          category === "tyre" ? formData.tyreSpecifications : undefined,
        wheelSpecifications:
          category === "wheel" ? formData.wheelSpecifications : undefined,
        isActive: true,
        isPopular: formData.isPopular,
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
          pricetext: "",
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
        router.push("/admin/products");
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

  const fetchFilterOptions = async () => {
    try {
      const res = await getAllMasterFilters({});
      if (res?.data?.items?.length > 0) {
        setFilterOptions(res.data.items);
      }
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Transform filter options for tyres
  const getTyreOptions = (subCategory: string) => {
    return filterOptions
      .filter(item => item.category === "tyre" && item.subCategory === subCategory)
      .map(item => ({
        label: item.values,
        value: item.values
      }));
  };

  // Transform filter options for wheels
  const getWheelOptions = (subCategory: string) => {
    return filterOptions
      .filter(item => item.category === "wheel" && item.subCategory === subCategory)
      .map(item => ({
        label: item.values,
        value: item.values
      }));
  };

  const handleCreateMasterFilter = async (
    subCategory: string,
    newValue: string,
  ) => {
    try {
      const payload = {
        category: category,
        subCategory: subCategory,
        values: newValue,
      };

      await createMasterFilter(payload);

      Toast({
        message: `${subCategory} created successfully`,
        type: "success",
      });

      await fetchFilterOptions();

      // Auto select the new value
      if (category === "tyre") {
        handleSelect(`tyre.${subCategory}`, newValue);
      } else if (category === "wheel") {
        handleSelect(`wheel.${subCategory}`, newValue);
      }
    } catch (error) {
      console.error("Failed to create filter:", error);
      Toast({
        message: "Failed to create option",
        type: "error",
      });
    }
  };

  // Tyre options
  const tyreOptions = {
    pattern: getTyreOptions("pattern"),
    width: getTyreOptions("width"),
    profile: getTyreOptions("profile"),
    diameter: getTyreOptions("diameter"),
    loadRating: getTyreOptions("loadRating"),
    speedRating: getTyreOptions("speedRating"),
  };

  // Wheel options
  const wheelOptions = {
    size: getWheelOptions("size"),
    color: getWheelOptions("color"),
    diameter: getWheelOptions("diameter"),
    fitments: getWheelOptions("fitments"),
    staggeredOptions: getWheelOptions("staggeredOptions"),
  };

  return (
    <div className="min-h-screen">
      <div>
        <div className="mb-8">
          <div className="mb-2 gap-3">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
              {isEdit ? "Edit Product" : "Create New Product"}
            </h1>
          </div>
          <p className="text-gray-400">
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
                maxFiles={5}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveImage}
              />
            </div>

            {/* Right Side - Basic Information Form */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
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
                    <Select
                      label="Brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleBrandChange}
                      options={brands}
                      placeholder={
                        loadingBrands ? "Loading brands..." : "Select brand"
                      }
                      error={errors.brand}
                      disabled={loadingBrands}
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
                    <FormLabel label="Price Note" />
                    <TextField
                      name="pricetext"
                      value={formData.pricetext}
                      onChange={handleChange}
                      placeholder="Enter text"
                    />
                  </div>
                  <div>
                    <FormLabel label="Description" />
                    <div className="mt-1">
                      <TextEditor
                        value={formData.description}
                        onChange={handleDescriptionChange}
                      />
                    </div>
                  </div>
                  <div>
                    <FormLabel label="Mark as Popular" />
                    <ToggleSwitch
                      checked={formData.isPopular}
                      onChange={() => {
                        setFormData((prev: any) => ({
                          ...prev,
                          isPopular: !prev.isPopular,
                        }));
                      }}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                {category === "tyre" ? "Tyre" : "Wheel"} Specifications
              </h2>
            </div>

            {category === "tyre" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Pattern"
                  required
                  searchable
                  isCreate={true}
                  name="tyre.pattern"
                  value={formData.tyreSpecifications.pattern}
                  onChange={(value) => handleSelect("tyre.pattern", value)}
                  onCreate={(value) => handleCreateMasterFilter("pattern", value)}
                  error={errors["tyre.pattern"]}
                  options={tyreOptions.pattern}
                  placeholder="Select pattern"
                />


                <Select
                  label="Width"
                  required
                  searchable
                  isCreate={true}
                  value={formData.tyreSpecifications.width}
                  onChange={(value) => handleSelect("tyre.width", value)}
                  onCreate={(value) => handleCreateMasterFilter("width", value)}
                  error={errors["tyre.width"]}
                  options={tyreOptions.width}
                  placeholder="Select width"
                />

                {/* Profile */}
                <Select
                  label="Profile"
                  required
                  searchable
                  isCreate={true}
                  value={formData.tyreSpecifications.profile}
                  onChange={(value) => handleSelect("tyre.profile", value)}
                  onCreate={(value) => handleCreateMasterFilter("profile", value)}
                  error={errors["tyre.profile"]}
                  options={tyreOptions.profile}
                  placeholder="Select profile"
                />

                <Select
                  label="Diameter"
                  required
                  searchable
                  isCreate={true}
                  value={formData.tyreSpecifications.diameter}
                  onChange={(value) => handleSelect("tyre.diameter", value)}
                  onCreate={(value) => handleCreateMasterFilter("diameter", value)}
                  error={errors["tyre.diameter"]}
                  options={tyreOptions.diameter}
                  placeholder="Select diameter"
                />

                <Select
                  label="Load Rating"
                  required
                  searchable
                  isCreate={true}
                  value={formData.tyreSpecifications.loadRating}
                  onChange={(value) => handleSelect("tyre.loadRating", value)}
                  onCreate={(value) => handleCreateMasterFilter("loadRating", value)}
                  error={errors["tyre.loadRating"]}
                  options={tyreOptions.loadRating}
                  placeholder="Select load rating"
                />

                <Select
                  label="Speed Rating"
                  required
                  searchable
                  isCreate={true}
                  value={formData.tyreSpecifications.speedRating}
                  onChange={(value) => handleSelect("tyre.speedRating", value)}
                  onCreate={(value) => handleCreateMasterFilter("speedRating", value)}
                  error={errors["tyre.speedRating"]}
                  options={tyreOptions.speedRating}
                  placeholder="Select speed rating"
                />
              </div>
            )}

            {category === "wheel" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Size"
                  required
                  searchable
                  isCreate={true}
                  name="wheel.size"
                  value={formData.wheelSpecifications.size}
                  onChange={(value) => handleSelect("wheel.size", value)}
                  onCreate={(value) => handleCreateMasterFilter("size", value)}
                  error={errors["wheel.size"]}
                  options={wheelOptions.size}
                  placeholder="Select size"
                />

                <Select
                  label="Color"
                  required
                  searchable
                  isCreate={true}
                  name="wheel.color"
                  value={formData.wheelSpecifications.color}
                  onChange={(value) => handleSelect("wheel.color", value)}
                  onCreate={(value) => handleCreateMasterFilter("color", value)}
                  error={errors["wheel.color"]}
                  options={wheelOptions.color}
                  placeholder="Select color"
                />
                <Select
                  label="Diameter"
                  required
                  searchable
                  isCreate={true}
                  value={formData.wheelSpecifications.diameter}
                  onChange={(value) => handleSelect("wheel.diameter", value)}
                  onCreate={(value) => handleCreateMasterFilter("diameter", value)}
                  error={errors["wheel.diameter"]}
                  options={wheelOptions.diameter}
                  placeholder="Select diameter"
                />
                <Select
                  label="Fitments"
                  required
                  searchable
                  isCreate={true}
                  value={formData.wheelSpecifications.fitments}
                  onChange={(value) => handleSelect("wheel.fitments", value)}
                  onCreate={(value) => handleCreateMasterFilter("fitments", value)}
                  error={errors["wheel.fitments"]}
                  options={wheelOptions.fitments}
                  placeholder="Select fitments"
                />

                <Select
                  label="Staggered Options"
                  required
                  searchable
                  isCreate={true}
                  value={formData.wheelSpecifications.staggeredOptions}
                  onChange={(value) =>
                    handleSelect("wheel.staggeredOptions", value)
                  }
                  onCreate={(value) => handleCreateMasterFilter("staggeredOptions", value)}
                  error={errors["wheel.staggeredOptions"]}
                  options={
                    formData.wheelSpecifications.staggeredOptions &&
                      !wheelOptions.staggeredOptions.find(
                        (o) =>
                          o.value ===
                          formData.wheelSpecifications.staggeredOptions,
                      )
                      ? [
                        ...wheelOptions.staggeredOptions,
                        {
                          label: formData.wheelSpecifications
                            .staggeredOptions,
                          value: formData.wheelSpecifications
                            .staggeredOptions,
                        },
                      ]
                      : wheelOptions.staggeredOptions
                  }
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
                onClick={() => router.push("/admin/products")}
              >
                Cancel
              </Button>
            )}
            <Button variant="primary">
              {isEdit
                ? isSubmitting
                  ? "Update..."
                  : "Update Product"
                : isSubmitting
                  ? "Create..."
                  : "Create New Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;