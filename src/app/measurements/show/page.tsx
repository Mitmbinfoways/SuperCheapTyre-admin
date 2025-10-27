"use client";

import React, { useState, useEffect, useCallback } from "react";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";
import { FiTrash2 } from "react-icons/fi";
import { getAllMasterFilters, deleteMasterFilterOption } from "@/services/MasterFilterService";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import useDebounce from "@/hooks/useDebounce";

interface MeasurementItem {
  id: string;
  category: string;
  type: string;
  value: string;
}

const ShowMeasurementsPage = () => {
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<MeasurementItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [masterFilterId, setMasterFilterId] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMeasurementId, setDeleteMeasurementId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);

  const loadMeasurements = useCallback(async () => {
    setLoading(true);
    try {
      const filter = {
        page: currentPage,
        limit: itemsPerPage,
        search: debounceSearch,
      };
      
      const response = await getAllMasterFilters(filter);
      const { items, pagination } = response.data;
      
      setTotalPages(pagination.totalPages);
      
      if (items && items.length > 0) {
        const masterFilter = items[0];
        setMasterFilterId(masterFilter._id);
        
        const transformedMeasurements: MeasurementItem[] = [];
        
        Object.entries(masterFilter.tyres).forEach(([key, values]) => {
          if (Array.isArray(values) && key !== "_id") {
            values.forEach((item: any) => {
              transformedMeasurements.push({
                id: item._id,
                category: "tyre",
                type: key,
                value: item.name
              });
            });
          }
        });
        
        // Process wheel measurements
        Object.entries(masterFilter.wheels).forEach(([key, values]) => {
          if (Array.isArray(values) && key !== "_id") {
            values.forEach((item: any) => {
              transformedMeasurements.push({
                id: item._id,
                category: "wheel",
                type: key,
                value: item.name
              });
            });
          }
        });
        
        setMeasurements(transformedMeasurements);
        setFilteredMeasurements(transformedMeasurements);
      } else {
        setMeasurements([]);
        setFilteredMeasurements([]);
        setMasterFilterId("");
      }
    } catch (error: any) {
      Toast({
        message:
          error?.response?.data?.message || "Failed to load measurements",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  useEffect(() => {
    // Filter measurements based on search and category
    let result = measurements;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.type.toLowerCase().includes(searchLower) ||
          m.value.toLowerCase().includes(searchLower),
      );
    }

    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }

    setFilteredMeasurements(result);
  }, [search, categoryFilter, measurements]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setDeleteMeasurementId(id);
    setShowDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteMeasurementId(null);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!deleteMeasurementId || !masterFilterId) {
      Toast({
        message: "Failed to delete measurement",
        type: "error",
      });
      return;
    }

    // Find the measurement to determine category and type
    const measurement = measurements.find(m => m.id === deleteMeasurementId);
    if (!measurement) {
      Toast({
        message: "Failed to delete measurement",
        type: "error",
      });
      return;
    }

    setDeleting(true);
    try {
      // We need to determine which field this measurement belongs to
      let field = measurement.type;
      let category: "tyres" | "wheels" = measurement.category === "tyre" ? "tyres" : "wheels";
      
      await deleteMasterFilterOption(masterFilterId, category, field, deleteMeasurementId);

      setMeasurements((prev) => prev.filter((m) => m.id !== deleteMeasurementId));
      setFilteredMeasurements((prev) => prev.filter((m) => m.id !== deleteMeasurementId));

      Toast({
        message: "Measurement deleted successfully!",
        type: "success",
      });
      
      // Close the dialog
      handleCloseDeleteDialog();
      
      // Reload measurements after deletion
      await loadMeasurements();
    } catch (error: any) {
      Toast({
        message:
          error?.response?.data?.message || "Failed to delete measurement",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatMeasurementType = (type: string) => {
    // Convert camelCase to Title Case
    return type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  
  const columns: Column<MeasurementItem>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => i + 1,
    },
    {
      title: "Category",
      key: "category",
      render: (item) => (
        <span className="font-medium capitalize">{item.category}</span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (item) => <span>{formatMeasurementType(item.type)}</span>,
    },
    {
      title: "Value",
      key: "value",
      render: (item) => <span className="font-medium">{item.value}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (item) => (
        <div
          onClick={() => handleDeleteClick(item.id)}
          className="flex justify-center"
        >
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
          />
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
          <Button>Add New Measurement</Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-1/4">
          <Select
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
        <div className="w-full md:w-1/4">
          <TextField
            type="text"
            placeholder="Search measurements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={handleCloseDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this measurement?
        </p>
      </CommonDialog>

      <div>
        {loading ? (
          <Skeleton />
        ) : filteredMeasurements.length === 0 ? (
          <EmptyState message="No measurements found." />
        ) : (
          <>
            <Table columns={columns} data={filteredMeasurements} />
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShowMeasurementsPage;