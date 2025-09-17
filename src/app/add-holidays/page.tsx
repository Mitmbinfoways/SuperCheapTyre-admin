"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import {
  GetHolidays,
  AddHoliday,
  DeleteHoliday,
} from "@/services/HolidayService";
import { Toast } from "@/components/ui/Toast";

type Holiday = {
  _id: string;
  date: string;
  reason: string;
  createdBy?: string;
};

// Updated Holiday type for table compatibility
type HolidayWithId = Holiday & { id: string };

const AddHolidayPage: React.FC = () => {
  const [date, setDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);

  const tableData: HolidayWithId[] = holidays?.map((h) => ({
    ...h,
    id: h._id,
  }));

  const loadHolidays = async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await GetHolidays();
      setHolidays(data.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load holidays");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleAddHoliday = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!date || !reason) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (editingHoliday) {
        await AddHoliday({ id: editingHoliday._id, date, reason });
        Toast({ type: "success", message: "Holiday updated successfully" });
      } else {
        await AddHoliday({ date, reason });
        Toast({ type: "success", message: "Holiday added successfully" });
      }
      setShowForm(false);
      setDate("");
      setReason("");
      setEditingHoliday(null);
      await loadHolidays();
    } catch (e: any) {
      console.log(e);
      setError(
        e?.response?.data?.errorData || "Failed to create/update holiday",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteHoliday = async () => {
    if (!deleteHolidayId) return;
    setFetching(true);
    setError(null);
    try {
      await DeleteHoliday(deleteHolidayId);
      await loadHolidays();
      Toast({ type: "success", message: "Holiday deleted successfully" });
    } catch (e: any) {
      setError(e.response?.data?.errorData || "Failed to delete holiday");
    } finally {
      setFetching(false);
      setShowDeleteDialog(false);
      setDeleteHolidayId(null);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setDate(holiday.date.split("T")[0]);
    setReason(holiday.reason);
    setShowForm(true);
  };

  const columns: Column<HolidayWithId>[] = [
    {
      title: "Index",
      key: "index",
      render: (_, index) => index + 1,
    },
    {
      title: "Date",
      key: "date",
      render: (item) => new Date(item.date).toDateString(),
    },
    {
      title: "Reason",
      key: "reason",
      render: (item) => (
        <span className="text-sm font-semibold dark:text-gray-200">
          {item.reason}
        </span>
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
            className="cursor-pointer text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            title="Edit holiday"
            onClick={() => handleEditHoliday(item)}
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 transition-colors hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            title="Delete holiday"
            onClick={() => {
              setDeleteHolidayId(item._id);
              setShowDeleteDialog(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-white">
          Manage Holidays
        </h1>
        <div>
          <Button
            onClick={() => {
              setEditingHoliday(null);
              setDate("");
              setReason("");
              setShowForm(true);
            }}
          >
            Add Holiday
          </Button>
        </div>
      </div>

      <CommonDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
      >
        {error && (
          <div className="mb-2 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleAddHoliday}>
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDate(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              placeholder="E.g. Independence Day"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setReason(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex items-center justify-end">
            <Button variant="primary" type="submit">
              {loading
                ? "Saving..."
                : editingHoliday
                  ? "Update Holiday"
                  : "Add Holiday"}
            </Button>
          </div>
        </form>
      </CommonDialog>

      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteHoliday}
              disabled={fetching}
            >
              {fetching ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this holiday? This action cannot be
          undone.
        </p>
      </CommonDialog>

      <div className="mt-8">
        {fetching ? (
          <p className="text-gray-500 dark:text-gray-400">
            Loading holidays...
          </p>
        ) : tableData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No data found.</p>
        ) : (
          <Table
            columns={columns}
            data={tableData}
            className="dark:divide-gray-700"
          />
        )}
      </div>
    </div>
  );
};

export default AddHolidayPage;
