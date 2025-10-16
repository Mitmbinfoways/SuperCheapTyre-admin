"use client";

import React, { useState, useEffect } from "react";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { getAllMeasurements, deleteMeasurement, Measurement } from "@/services/MeasurementService";
import Link from "next/link";

const ShowMeasurementsPage = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<Measurement[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch measurements from API
    const fetchMeasurements = async () => {
      setLoading(true);
      try {
        const response = await getAllMeasurements();
        setMeasurements(response.data.items);
        setFilteredMeasurements(response.data.items);
      } catch (error: any) {
        Toast({
          message: error?.response?.data?.errorData || "Failed to load measurements",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, []);

  useEffect(() => {
    // Filter measurements based on search and category
    let result = measurements;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(m => 
        m.type.toLowerCase().includes(searchLower) || 
        m.value.toLowerCase().includes(searchLower)
      );
    }
    
    if (categoryFilter) {
      result = result.filter(m => m.category === categoryFilter);
    }
    
    setFilteredMeasurements(result);
  }, [search, categoryFilter, measurements]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMeasurement(id);
      
      setMeasurements(prev => prev.filter(m => m.id !== id));
      setFilteredMeasurements(prev => prev.filter(m => m.id !== id));
      
      Toast({
        message: "Measurement deleted successfully!",
        type: "success",
      });
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.errorData || "Failed to delete measurement",
        type: "error",
      });
    }
  };

  const formatMeasurementType = (type: string) => {
    // Convert camelCase to Title Case
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const columns: Column<Measurement>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => i + 1,
    },
    {
      title: "Category",
      key: "category",
      width: "100px",
      render: (item) => (
        <span className="capitalize font-medium">{item.category}</span>
      ),
    },
    {
      title: "Type",
      key: "type",
      width: "150px",
      render: (item) => (
        <span>{formatMeasurementType(item.type)}</span>
      ),
    },
    {
      title: "Value",
      key: "value",
      width: "150px",
      render: (item) => (
        <span className="font-medium">{item.value}</span>
      ),
    },
    {
      title: "Created At",
      key: "createdAt",
      width: "150px",
    },
    {
      title: "Actions",
      key: "actions",
      width: "100px",
      render: (item) => (
        <div className="flex justify-center">
          <Button 
            variant="danger" 
            className="px-2 py-1 text-xs"
            onClick={() => handleDelete(item.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Measurements
        </h1>
        <Link href="/measurements">
          <Button>
            Add New Measurement
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-1/3">
          <TextField
            type="text"
            placeholder="Search measurements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-1/4">
          <Select
            label="Filter by Category"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            options={[
              { label: "All Categories", value: "" },
              { label: "Tyre", value: "tyre" },
              { label: "Wheel", value: "wheel" },
            ]}
            placeholder="Select category"
          />
        </div>
      </div>

      <div>
        {loading ? (
          <Skeleton />
        ) : filteredMeasurements.length === 0 ? (
          <EmptyState message="No measurements found." />
        ) : (
          <Table columns={columns} data={filteredMeasurements} />
        )}
      </div>
    </div>
  );
};

export default ShowMeasurementsPage;