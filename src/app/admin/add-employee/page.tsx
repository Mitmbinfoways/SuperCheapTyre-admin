"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import { Toast } from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import {
  AddTechnician,
  DeleteTechnician,
  GetTechnicians,
  UpdateTechnician,
} from "@/services/TechnicianService";
import ToggleSwitch from "../../../components/ui/Toggle";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Select from "@/components/ui/Select";


interface Technician {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  updatedAt: any;
  isActive: boolean;
}

type LoadingStates = {
  fetching: boolean;
  submitting: boolean;
  deleting: boolean;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  apiError?: string;
};

const AddTechnicianPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState<FormErrors>({});
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState<Technician | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTechnicianId, setDeleteTechnicianId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetching: false,
    submitting: false,
    deleting: false,
  });

  const updateLoading = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const tableData = technicians.map((t) => ({ ...t, id: t._id }));

  const debounceSearch = useDebounce<string>(search, 300);

  const loadTechnicians = useCallback(async () => {
    updateLoading("fetching", true);
    setError({});
    try {
      const filter: any = { 
        currentPage, 
        itemsPerPage, 
        search: debounceSearch 
      };
      
      if (statusFilter !== "All") {
        filter.isActive = statusFilter === "Active";
      }
      
      const data = await GetTechnicians(filter);
      const { items, pagination } = data.data;
      setTechnicians(items as Technician[]);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      setError({
        apiError: e?.response?.data?.errorData || "Failed to load technicians",
      });
    } finally {
      updateLoading("fetching", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch, statusFilter]);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  const handleSaveTechnician = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError({});

    const newError: FormErrors = {};
    if (!formData.firstName.trim())
      newError.firstName = "First name is required";
    if (!formData.lastName.trim()) newError.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newError.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newError.email = "Enter a valid email";
    }
    if (!formData.phone.trim()) {
      newError.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newError.phone = "Enter a valid 10-digit phone number";
    }

    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    updateLoading("submitting", true);

    try {
      if (isEdit) {
        await UpdateTechnician({ id: isEdit._id, ...formData });
        Toast({ type: "success", message: "Technician updated successfully!" });
      } else {
        await AddTechnician(formData);
        Toast({ type: "success", message: "Technician added successfully!" });
      }
      handleCloseForm();
      await loadTechnicians();
    } catch (e: any) {
      setError({
        apiError: e?.response?.data?.errorData || "Failed to save technician",
      });
    } finally {
      updateLoading("submitting", false);
    }
  };

  const confirmDeleteTechnician = async () => {
    if (!deleteTechnicianId) return;
    updateLoading("deleting", true);
    setError({});
    try {
      await DeleteTechnician(deleteTechnicianId);
      Toast({ type: "success", message: "Technician deleted successfully!" });
      handleCloseDeleteDialog();
      await loadTechnicians();
    } catch (e: any) {
      setError({
        apiError: e?.response?.data?.errorData || "Failed to delete technician",
      });
    } finally {
      updateLoading("deleting", false);
    }
  };

  const handleEditTechnician = (t: Technician) => {
    setIsEdit(t);
    setFormData({
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
    });
    setShowForm(true);
    setError({});
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEdit(null);
    setFormData({ firstName: "", lastName: "", email: "", phone: "" });
    setError({});
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteTechnicianId(null);
    setError({});
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  const handleToggleActive = async (t: Technician) => {
    try {
      const updatedStatus = !t.isActive;
      await UpdateTechnician({ id: t._id, isActive: updatedStatus });
      setTechnicians((prev) =>
        prev.map((tech) =>
          tech._id === t._id ? { ...tech, isActive: updatedStatus } : tech,
        ),
      );
      Toast({
        type: "success",
        message: `Technician ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      setError({
        apiError: e?.response?.data?.errorData || "Failed to toggle status",
      });
    }
  };

  const columns: Column<Technician & { id: string }>[] = [
    {
      title: "Index",
      key: "index",
      render: (_, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      title: "Name",
      key: "firstName",
      render: (item) => item.firstName + " " + item.lastName,
    },
    { title: "Email", key: "email" },
    { title: "Phone", key: "phone", render: (item) => item.phone },
    {
      title: "Status",
      key: "isActive",
      width: "100px",
      align: "center",
      render: (item) => (
        <Badge
          label={item.isActive ? "Active" : "Inactive"}
          color={item.isActive ? "green" : "red"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          <MdModeEdit
            size={16}
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => handleEditTechnician(item)}
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteTechnicianId(item._id);
              setShowDeleteDialog(true);
            }}
          />
          <ToggleSwitch
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Employee
        </h1>
        <Button
          onClick={() => {
            setIsEdit(null);
            setFormData({ firstName: "", lastName: "", email: "", phone: "" });
            setError({});
            setShowForm(true);
          }}
          className="w-full sm:w-auto"
        >
          Add Employee
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <div className="sm:py-7 w-full sm:w-1/3">
          <TextField
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Status", value: "All" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>
        <div className="flex items-center">
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>
      
      <CommonDialog
        isOpen={showForm}
        size="lg"
        onClose={handleCloseForm}
        title={isEdit ? "Edit Technician" : "Add Technician"}
      >
        {error.apiError && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error.apiError}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSaveTechnician}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FormLabel label="First Name" required />
              <TextField
                type="text"
                value={formData.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="First Name"
                error={error.firstName}
                className="w-full"
              />
            </div>
            <div>
              <FormLabel label="Last Name" required />
              <TextField
                type="text"
                value={formData.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Last Name"
                error={error.lastName}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FormLabel label="Email" required />
              <TextField
                type="text"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={error.email}
                placeholder="Email"
                className="w-full"
              />
            </div>
            <div>
              <FormLabel label="Phone" required />
              <TextField
                type="number"
                value={formData.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Phone"
                error={error.phone}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
            >
              {loadingStates.submitting
                ? "Saving..."
                : isEdit
                  ? "Update Technician"
                  : "Add Technician"}
            </Button>
          </div>
        </form>
      </CommonDialog>
      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-3">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteTechnician}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this technician?
        </p>
      </CommonDialog>
      <div className="overflow-x-auto">
        {loadingStates.fetching || loadingStates.deleting ? (
          <Skeleton />
        ) : tableData.length === 0 ? (
          <EmptyState message="No technicians found." />
        ) : (
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddTechnicianPage;