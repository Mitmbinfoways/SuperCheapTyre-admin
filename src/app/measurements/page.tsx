"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { FormLabel } from "@/components/ui/FormLabel";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
// Import the updateMasterFilter function from MasterFilterService
import { updateMasterFilter } from "@/services/MasterFilterService";

const MeasurementsPage = () => {
  const router = useRouter();

  const [category, setCategory] = useState<string>("");
  const [measurementType, setMeasurementType] = useState<string>("");
  const [measurementValue, setMeasurementValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCancel = () => {
    router.push("/measurements/show");
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

      // Prepare the update payload
      const updatePayload: any = {};
      
      if (category === "tyre") {
        updatePayload.tyres = {
          [measurementType]: [{ name: measurementValue.trim() }]
        };
      } else {
        updatePayload.wheels = {
          [measurementType]: [{ name: measurementValue.trim() }]
        };
      }

      // Use the static ID for the update operation
      await updateMasterFilter("68ff3a4c7103d681ad65162a", updatePayload);

      Toast({
        message: "Measurement added successfully!",
        type: "success",
      });

      setCategory("");
      setMeasurementType("");
      setMeasurementValue("");
    } catch (error: any) {
      Toast({
        message:
          error?.response?.data?.message || "Failed to add measurement",
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
                setMeasurementType("");
                setMeasurementValue("");
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
                onChange={(e) => setMeasurementValue(e.target.value)}
                placeholder={getValuePlaceholder()}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
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