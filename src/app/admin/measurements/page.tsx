"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
// Import the updateMasterFilter function from MasterFilterService
import {
  createMasterFilter,
  updateMasterFilter,
} from "@/services/MasterFilterService";

const MeasurementsPage = () => {
  const router = useRouter();

  const [category, setCategory] = useState<string>("");
  const [measurementType, setMeasurementType] = useState<string>("");
  const [measurementValue, setMeasurementValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  const handleCancel = () => {
    router.push("/admin/measurements/show");
  };

  const tyreMeasurements = [
    { value: "width", label: "Width" },
    { value: "diameter", label: "Diameter" },
    { value: "profile", label: "Profile" },
    { value: "loadRating", label: "Load Rating" },
    { value: "speedRating", label: "Speed Rating" },
    { value: "pattern", label: "Pattern" },
  ];

  const wheelMeasurements = [
    { value: "size", label: "Size" },
    { value: "color", label: "Color" },
    { value: "fitments", label: "Fitments" },
    { value: "diameter", label: "Diameter" },
    { value: "staggeredOptions", label: "Staggered Options" },
  ];

  const getMeasurementOptions = () => {
    if (category === "tyre") return tyreMeasurements;
    if (category === "wheel") return wheelMeasurements;
    return [];
  };

  const getValuePlaceholder = () => {
    if (!measurementType) return "Enter value";

    const typeLabels: Record<string, string> = {
      width: "Enter width value",
      diameter: "Enter diameter value",
      profile: "Enter profile value",
      loadRating: "Enter load rating value",
      speedRating: "Enter speed rating value",
      pattern: "Enter pattern value",
      size: "Enter size value",
      color: "Enter color value",
      fitments: "Enter fitments value",
      staggeredOptions: "Enter staggered options value",
    };

    return typeLabels[measurementType] || "Enter value";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!category || !measurementType || !measurementValue.trim()) {
      Toast({
        message: "Please fill all fields",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the payload for the backend API
      const payload = {
        category,
        subCategory: measurementType,
        values: measurementValue.trim(),
      };

      // Try to update first using the static ID
      try {
        await updateMasterFilter("69089a30dd478485bc647fc3", payload);
        Toast({
          message: "Measurement updated successfully!",
          type: "success",
        });
      } catch (updateError: any) {
        // If update fails, try creating a new one
        await createMasterFilter(payload);
        Toast({
          message: "Measurement created successfully!",
          type: "success",
        });
      }

      setCategory("");
      setMeasurementType("");
      setMeasurementValue("");
    } catch (error: any) {
      setApiError(error?.response?.data?.errorData);
      Toast({
        message:
          error?.response?.data?.errorData || "Failed to add measurement",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="mb-2 gap-3">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-300">
            Add Measurement
          </h1>
        </div>
        <p className="text-gray-400">
          Add new measurements for tyres or wheels
        </p>
      </div>

      {apiError && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 p-4 text-red-700">
          {apiError}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Select
              label="Category"
              required
              value={category}
              onChange={(value) => {
                setCategory(value);
                setMeasurementType("");
                setMeasurementValue("");
                setApiError("");
              }}
              options={[
                { label: "Tyre", value: "tyre" },
                { label: "Wheel", value: "wheel" },
              ]}
              placeholder="Select category"
            />

            <Select
              label="Measurement Type"
              required
              value={measurementType}
              onChange={(value) => {
                setMeasurementType(value);
                setMeasurementValue("");
                setApiError("");
              }}
              options={getMeasurementOptions()}
              placeholder="Select measurement type"
              disabled={!category}
            />
          </div>

          {measurementType && (
            <div>
              <FormLabel
                label={`${measurementType.charAt(0).toUpperCase() + measurementType.slice(1)} Value`}
                required
              />
              <TextField
                name="measurementValue"
                value={measurementValue}
                onChange={(e) => {
                  setMeasurementValue(e.target.value);
                  setApiError("");
                }}
                placeholder={getValuePlaceholder()}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isSubmitting ? "Adding..." : "Add Measurement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeasurementsPage;
