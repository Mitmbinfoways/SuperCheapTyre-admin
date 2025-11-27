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
import {
  getAllMasterFilters,
  getMasterFilterById,
  deleteMasterFilter,
} from "@/services/MasterFilterService";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import useDebounce from "@/hooks/useDebounce";
import Tooltip from "@/components/ui/Tooltip";
import { calculatePageAfterDeletion } from "@/utils/paginationUtils";

interface MeasurementItem {
  id: string;
  category: string;
  type: string;
  value: string;
}

const ShowMeasurementsPage = () => {
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<MeasurementItem[]>([]);
  const [paginatedMeasurements, setPaginatedMeasurements] = useState<MeasurementItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMeasurementId, setDeleteMeasurementId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);

  const loadMeasurements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllMasterFilters({});
      const { items } = response.data;

      // Transform the flat structure to the format expected by the UI
      const transformedMeasurements: MeasurementItem[] = items.map((item: any) => ({
        id: item._id,
        category: item.category,
        type: item.subCategory,
        value: item.values,
      }));

      setMeasurements(transformedMeasurements);
      setFilteredMeasurements(transformedMeasurements);

      const uniqueTypes = [
        ...new Set(transformedMeasurements.map((m) => m.type)),
      ];
      setTypeOptions(
        uniqueTypes.map((t) => ({
          label: formatMeasurementType(t),
          value: t,
        }))
      );
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to load measurements",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  useEffect(() => {
    if (!categoryFilter) {
      const allTypes = [...new Set(measurements.map((m) => m.type))];
      setTypeOptions(allTypes.map((t) => ({ label: formatMeasurementType(t), value: t })));
    } else {
      const filtered = measurements.filter((m) => m.category === categoryFilter);
      const types = [...new Set(filtered.map((m) => m.type))];
      setTypeOptions(types.map((t) => ({ label: formatMeasurementType(t), value: t })));
    }
    setTypeFilter(""); // Reset type filter when category changes
  }, [categoryFilter, measurements]);

  useEffect(() => {
    let result = measurements;

    if (debounceSearch) {
      const searchLower = debounceSearch.toLowerCase();
      result = result.filter(
        (m) =>
          m.type.toLowerCase().includes(searchLower) ||
          m.value.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }

    if (typeFilter) {
      result = result.filter((m) => m.type === typeFilter);
    }

    setFilteredMeasurements(result);
    setCurrentPage(1);
  }, [debounceSearch, categoryFilter, typeFilter, measurements]);

  useEffect(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    setPaginatedMeasurements(filteredMeasurements.slice(startIdx, endIdx));
    setTotalPages(Math.ceil(filteredMeasurements.length / itemsPerPage));
  }, [filteredMeasurements, currentPage]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleDeleteClick = (id: string) => {
    setDeleteMeasurementId(id);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteMeasurementId(null);
  };

  const confirmDelete = async () => {
    if (!deleteMeasurementId) {
      Toast({ message: "Failed to delete measurement", type: "error" });
      return;
    }

    setDeleting(true);
    try {
      // Delete the master filter entry by its ID
      await deleteMasterFilter(deleteMeasurementId);

      const updated = measurements.filter((m) => m.id !== deleteMeasurementId);
      setMeasurements(updated);
      setFilteredMeasurements(updated);

      Toast({ message: "Measurement deleted successfully!", type: "success" });
      handleCloseDeleteDialog();
      
      // Check if we need to navigate to the previous page
      const newPage = calculatePageAfterDeletion(paginatedMeasurements.length, currentPage, totalPages);
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to delete measurement",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatMeasurementType = (type: string) =>
    type.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const columns: Column<MeasurementItem>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => (currentPage - 1) * itemsPerPage + i + 1,
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
        <div onClick={() => handleDeleteClick(item.id)} className="flex justify-center">
          <Tooltip content="Delete measurement">
            <FiTrash2
              size={16}
              className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-md dark:bg-gray-900">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-primary dark:text-gray-300">
          Measurements List ({measurements?.length || 0})
        </h1>
        <Link href="/admin/measurements" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Add New Measurement</Button>
        </Link>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="w-full">
          <TextField
            type="text"
            placeholder="Search measurements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full">
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
        <div className="w-full">
          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={[{ label: "All Types", value: "" }, ...typeOptions]}
            placeholder="Select type"
          />
        </div>
      </div>
      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteDialog}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
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
            <div className="overflow-x-auto">
              <Table columns={columns} data={paginatedMeasurements} />
            </div>
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