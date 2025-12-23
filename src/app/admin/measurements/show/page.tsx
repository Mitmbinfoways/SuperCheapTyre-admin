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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";
import {
  getAllMasterFilters,
  getMasterFilterById,
  deleteMasterFilter,
  updateMasterFilter,
} from "@/services/MasterFilterService";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import useDebounce from "@/hooks/useDebounce";
import Tooltip from "@/components/ui/Tooltip";
import { calculatePageAfterDeletion } from "@/utils/paginationUtils";
import { MdModeEdit } from "react-icons/md";

interface MeasurementItem {
  id: string;
  category: string;
  type: string;
  value: string;
}

const ShowMeasurementsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
  const currentPage = Number(searchParams.get("page")) || 1;
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);

  // Edit State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementItem | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    type: "",
    value: "",
  });
  const [updating, setUpdating] = useState(false);

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

  const prevFilters = React.useRef({
    search: debounceSearch,
    category: categoryFilter,
    type: typeFilter,
  });

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

    // Reset to first page when filters change
    const hasFiltersChanged =
      debounceSearch !== prevFilters.current.search ||
      categoryFilter !== prevFilters.current.category ||
      typeFilter !== prevFilters.current.type;

    if (hasFiltersChanged) {
      prevFilters.current = {
        search: debounceSearch,
        category: categoryFilter,
        type: typeFilter,
      };

      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (current.get("page") !== "1") {
        current.set("page", "1");
        router.push(`${pathname}?${current.toString()}`);
      }
    }
  }, [debounceSearch, categoryFilter, typeFilter, measurements]);

  useEffect(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    setPaginatedMeasurements(filteredMeasurements.slice(startIdx, endIdx));
    setTotalPages(Math.ceil(filteredMeasurements.length / itemsPerPage));
  }, [filteredMeasurements, currentPage]);

  const handlePageChange = (page: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", String(page));
    router.push(`${pathname}?${current.toString()}`);
  }

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
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("page", String(newPage));
        router.push(`${pathname}?${current.toString()}`);
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

  const handleEditClick = (item: MeasurementItem) => {
    setEditingMeasurement(item);
    setEditForm({
      category: item.category,
      type: item.type,
      value: item.value,
    });
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingMeasurement(null);
    setEditForm({ category: "", type: "", value: "" });
  };

  const handleUpdate = async () => {
    if (!editingMeasurement) return;

    if (!editForm.category || !editForm.type || !editForm.value) {
      Toast({ message: "All fields are required", type: "error" });
      return;
    }

    setUpdating(true);
    try {
      await updateMasterFilter(editingMeasurement.id, {
        category: editForm.category,
        subCategory: editForm.type,
        values: editForm.value,
      });

      const updatedMeasurements = measurements.map((m) =>
        m.id === editingMeasurement.id
          ? {
            ...m,
            category: editForm.category,
            type: editForm.type,
            value: editForm.value,
          }
          : m
      );

      setMeasurements(updatedMeasurements);

      Toast({ message: "Measurement updated successfully", type: "success" });
      handleCloseEditDialog();
    } catch (error: any) {
      Toast({
        message: error?.response?.data?.message || "Failed to update measurement",
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

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
        <div className="flex justify-center space-x-2">
          <Tooltip content="Edit measurement">
            <MdModeEdit
              size={16}
              className="cursor-pointer text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-500"
              onClick={() => handleEditClick(item)}
            />
          </Tooltip>
          <Tooltip content="Delete measurement">
            <FiTrash2
              size={16}
              className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
              onClick={() => handleDeleteClick(item.id)}
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="w-full">
          {(search || categoryFilter || typeFilter) && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setTypeFilter("");
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <CommonDialog
        isOpen={showEditDialog}
        onClose={handleCloseEditDialog}
        title="Edit Measurement"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <Select
              value={editForm.category}
              onChange={(value) => setEditForm({ ...editForm, category: value })}
              options={[
                { label: "Tyre", value: "tyre" },
                { label: "Wheel", value: "wheel" },
              ]}
              placeholder="Select category"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type (Sub Category)
            </label>
            <TextField
              type="text"
              placeholder="e.g. Width, Diameter"
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Value
            </label>
            <TextField
              type="text"
              placeholder="e.g. 205, 17"
              value={editForm.value}
              onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
            />
          </div>
        </div>
      </CommonDialog>
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