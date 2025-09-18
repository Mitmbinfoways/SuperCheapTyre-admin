"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { FiPackage } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import ImageUploader from "@/components/ui/ImageUpload";
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

const Page = () => {
  const [category, setCategory] = useState<string>("tyre");
  const [formData, setFormData] = useState<any>({
    name: "",
    brand: "",
    price: "",
    stock: "",
    images: [],
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

  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const previewUrls = filesArray.map((file) => URL.createObjectURL(file));

      setFormData((prev: any) => ({
        ...prev,
        images: [...prev.images, ...previewUrls],
      }));
    }
  };

  // Remove image from preview
  const handleRemoveImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", { ...formData, category });
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
            <h1 className="text-3xl font-bold text-primary">Create Product</h1>
          </div>
          <p className="text-gray-600">
            Add a new product to your inventory with detailed specifications
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col gap-6 rounded-xl border-gray-200 bg-white lg:flex-row">
            <div className="flex-1">
              <ImageUploader
                images={formData.images}
                onChange={(images) =>
                  setFormData((prev: any) => ({ ...prev, images }))
                }
              />
            </div>

            {/* Right Side - Basic Information Form */}
            <div className="flex-1">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Category */}
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

                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <TextField
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Brand <span className="text-red-500">*</span>
                    </label>
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
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Price <span className="text-red-500">*</span>
                      </label>
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

                    {/* Stock */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Specifications Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <IoSettingsOutline className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {category === "tyre" ? "Tyre" : "Wheel"} Specifications
              </h2>
            </div>

            {category === "tyre" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Pattern */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Pattern
                  </label>
                  <Select
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

                {/* Width */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Width
                  </label>
                  <Select
                    name="tyre.width"
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Profile
                  </label>
                  <Select
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

                {/* Diameter */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Diameter
                  </label>
                  <Select
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Load Rating
                  </label>
                  <Select
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
                    options={loadrating}
                    placeholder="Select load rating"
                  />
                </div>

                {/* Speed Rating */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Speed Rating
                  </label>
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Size
                  </label>
                  <Select
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
                {/* Color */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Color
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

                {/* Diameter */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Diameter
                  </label>
                  <Select
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

                {/* Fitments */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fitments
                  </label>
                  <Select
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Staggered Options
                  </label>
                  <Select
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
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
