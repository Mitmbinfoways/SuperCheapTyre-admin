"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import { Toast } from "@/components/ui/Toast";
import { createMeasurement } from "@/services/MeasurementService";

const MeasurementsPage = () => {
  const [category, setCategory] = useState<string>("");
  const [measurementType, setMeasurementType] = useState<string>("");
  const [measurementValue, setMeasurementValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Measurement types based on category
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
      
      // Create measurement through API
      const payload = {
        category: category as "tyre" | "wheel",
        type: measurementType,
        value: measurementValue.trim(),
      };
      
      await createMeasurement(payload);
      
      Toast({
        message: "Measurement added successfully!",
        type: "success",
      });
      
      // Reset form
      setCategory("");
      setMeasurementType("");
      setMeasurementValue("");
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.errorData || "Failed to add measurement",
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
        <p className="text-gray-600">
          Add new measurements for tyres or wheels
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Select
              label="Category"
              required
              value={category}
              onChange={(value) => {
                setCategory(value);
                setMeasurementType(""); // Reset measurement type when category changes
                setMeasurementValue(""); // Reset measurement value when category changes
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
                setMeasurementValue(""); // Reset measurement value when type changes
              }}
              options={getMeasurementOptions()}
              placeholder="Select measurement type"
              disabled={!category}
            />
          </div>

          {measurementType && (
            <div>
              <FormLabel label={`${measurementType.charAt(0).toUpperCase() + measurementType.slice(1)} Value`} required />
              <TextField
                name="measurementValue"
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
                placeholder={getValuePlaceholder()}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Adding..." : "Add Measurement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeasurementsPage;