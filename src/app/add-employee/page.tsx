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
import ToggleSwitch from "../../components/ui/Toggle";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";

interface Technician {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  updatedAt: any;
  isActive: boolean; // ✅ added for toggle
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type LoadingStates = {
  fetching: boolean;
  submitting: boolean;
  deleting: boolean;
};

const AddTechnicianPage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetching: false,
    submitting: false,
    deleting: false,
  });

  const updateLoading = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  console.log(loadingStates);

  const tableData = technicians.map((t) => ({ ...t, id: t._id }));

  const loadTechnicians = useCallback(async () => {
    updateLoading("fetching", true);
    setError(null);
    try {
      const filter = { currentPage, itemsPerPage };
      const data = await GetTechnicians(filter);
      const { items, pagination } = data.data;
      setTechnicians(items as Technician[]);
      setTotalPages(pagination.totalPages);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to load technicians",
      );
    } finally {
      updateLoading("fetching", false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    loadTechnicians();
  }, [currentPage, itemsPerPage, loadTechnicians]);

  const handleSaveTechnician = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName || !lastName || !email || !phone) return;
    setError(null);

    try {
      if (isEdit) {
        await UpdateTechnician({
          id: isEdit._id,
          firstName,
          lastName,
          email,
          phone,
        });
        Toast({ type: "success", message: "Technician updated successfully!" });
      } else {
        await AddTechnician({ firstName, lastName, email, phone });
        Toast({ type: "success", message: "Technician added successfully!" });
      }
      handleCloseForm();
      await loadTechnicians();
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to save technician",
      );
    } finally {
      updateLoading("submitting", false);
    }
  };

  const confirmDeleteTechnician = async () => {
    if (!deleteTechnicianId) return;
    updateLoading("deleting", true);
    setError(null);
    try {
      await DeleteTechnician(deleteTechnicianId);
      Toast({ type: "success", message: "Technician deleted successfully!" });
      handleCloseDeleteDialog();
      await loadTechnicians();
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to delete technician",
      );
    } finally {
      updateLoading("deleting", false);
    }
  };

  const handleEditTechnician = (t: Technician) => {
    setIsEdit(t);
    setFirstName(t.firstName);
    setLastName(t.lastName);
    setEmail(t.email);
    setPhone(t.phone);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEdit(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setError(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteTechnicianId(null);
    setError(null);
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
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to toggle technician status",
      );
    }
  };

  const columns: Column<Technician & { id: string }>[] = [
    {
      title: "Index",
      key: "index",
      render: (_, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { title: "First Name", key: "firstName", render: (item) => item.firstName },
    { title: "Last Name", key: "lastName", render: (item) => item.lastName },
    { title: "Email", key: "email" },
    { title: "Phone", key: "phone", render: (item) => item.phone },
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-white">
          Manage Technicians
        </h1>
        <Button
          onClick={() => {
            setIsEdit(null);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setError(null);
            setShowForm(true);
          }}
          disabled={loadingStates.fetching}
        >
          Add Technician
        </Button>
      </div>

      {/* Add/Edit Form */}
      <CommonDialog
        isOpen={showForm}
        size="lg"
        onClose={handleCloseForm}
        title={isEdit ? "Edit Technician" : "Add Technician"}
      >
        {error && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSaveTechnician}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FormLabel label="First Name" required />
              <div className="relative">
                <TextField
                  type="number"
                  value={firstName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFirstName(e.target.value)
                  }
                  placeholder="First Name"
                />
              </div>
            </div>
            <div>
              <FormLabel label="Last Name" required />
              <div className="relative">
                <TextField
                  type="number"
                  value={lastName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setLastName(e.target.value)
                  }
                  placeholder="Last Name"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FormLabel label="Email" required />
              <div className="relative">
                <TextField
                  type="number"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Email"
                />
              </div>
            </div>
            <div>
              <FormLabel label="Phone" required />
              <div className="relative">
                <TextField
                  type="number"
                  value={phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Phone"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              disabled={loadingStates.submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loadingStates.submitting}
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

      {/* Delete Confirm */}
      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteDialog}
              disabled={loadingStates.deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteTechnician}
              disabled={loadingStates.deleting}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to delete this technician?</p>
      </CommonDialog>

      {/* Table */}
      <div className="mt-8">
        {loadingStates.fetching ? (
          <p className="text-center text-gray-500">Loading technicians...</p>
        ) : tableData.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No technicians found.
          </p>
        ) : (
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex justify-center">
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