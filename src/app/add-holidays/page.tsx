"use client";

import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
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
import Pagination from "@/components/ui/Pagination";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import DatePicker from "@/components/ui/DatePicker";

type Holiday = {
  _id: string;
  date: string;
  reason: string;
  createdBy?: string;
};

type HolidayWithId = Holiday & { id: string };

type LoadingStates = {
  fetchingHolidays: boolean;
  submittingForm: boolean;
  deletingHoliday: boolean;
};

const AddHolidayPage: React.FC = () => {
  const [date, setDate] = useState<Date | null>(null);
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingHolidays: false,
    submittingForm: false,
    deletingHoliday: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const getTodayDate = (): string => {
    const TodayDate = new Date();
    return TodayDate.toISOString().split("T")[0];
  };

  const tableData: HolidayWithId[] = holidays?.map((h) => ({
    ...h,
    id: h._id,
  }));

  const loadHolidays = useCallback(async () => {
    updateLoadingState("fetchingHolidays", true);
    setError(null);
    try {
      const filter = {
        currentPage,
        itemsPerPage,
      };
      const data = await GetHolidays(filter);
      const { items, pagination } = data.data;
      setHolidays(items);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      setError(e?.response?.data?.errorData || "Failed to load holidays");
    } finally {
      updateLoadingState("fetchingHolidays", false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    loadHolidays();
  }, [currentPage, itemsPerPage, loadHolidays]);

  const formatToYmd = (d: Date) => d.toISOString().split("T")[0];

  const handleAddHoliday = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!date || !reason) return;
    updateLoadingState("submittingForm", true);
    setError(null);

    try {
      const payloadDate = formatToYmd(date as Date);
      if (editingHoliday) {
        await AddHoliday({ id: editingHoliday._id, date: payloadDate, reason });
        Toast({
          type: "success",
          message: "Holiday updated successfully!",
        });
      } else {
        await AddHoliday({ date: payloadDate, reason });
        Toast({
          type: "success",
          message: "Holiday added successfully!",
        });
      }
      handleCloseForm();
      await loadHolidays();
    } catch (e: any) {
      setError(
        e?.response?.data?.errorData || "Failed to create/update holiday",
      );
    } finally {
      updateLoadingState("submittingForm", false);
    }
  };

  const confirmDeleteHoliday = async () => {
    if (!deleteHolidayId) return;
    updateLoadingState("deletingHoliday", true);
    setError(null);
    try {
      await DeleteHoliday(deleteHolidayId);
      Toast({
        type: "success",
        message: "Holiday deleted successfully!",
      });
      handleCloseDeleteDialog();
      await loadHolidays();
    } catch (e: any) {
      setError(e.response?.data?.errorData || "Failed to delete holiday");
    } finally {
      updateLoadingState("deletingHoliday", false);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setDate(new Date(holiday.date));
    setReason(holiday.reason);
    setShowForm(true);
    setError(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHoliday(null);
    setDate(null);
    setReason("");
    setError(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteHolidayId(null);
    setError(null);
  };

  // Loading component for table
  const LoadingTable = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800"></div>
      ))}
    </div>
  );

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
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          <MdModeEdit
            size={16}
            className={`cursor-pointer transition-colors ${
              loadingStates.fetchingHolidays || loadingStates.deletingHoliday
                ? "cursor-not-allowed text-gray-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            }`}
            title="Edit holiday"
            onClick={() => {
              if (
                !loadingStates.fetchingHolidays &&
                !loadingStates.deletingHoliday
              ) {
                handleEditHoliday(item);
              }
            }}
          />
          <FiTrash2
            size={16}
            className={`cursor-pointer transition-colors ${
              loadingStates.fetchingHolidays || loadingStates.deletingHoliday
                ? "cursor-not-allowed text-gray-400"
                : "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            }`}
            title="Delete holiday"
            onClick={() => {
              if (
                !loadingStates.fetchingHolidays &&
                !loadingStates.deletingHoliday
              ) {
                setDeleteHolidayId(item._id);
                setShowDeleteDialog(true);
              }
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
              setDate(null);
              setReason("");
              setError(null);
              setShowForm(true);
            }}
            disabled={loadingStates.fetchingHolidays}
          >
            {loadingStates.fetchingHolidays ? "Loading..." : "Add Holiday"}
          </Button>
        </div>
      </div>

      <CommonDialog
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
      >
        {error && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleAddHoliday}>
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Date *
            </label>
            <DatePicker
              value={date}
              onChange={(d: Date | null) => setDate(d)}
              minDate={new Date()}
              placeholder="Select a date"
              className="w-full"
              disabled={loadingStates.submittingForm}
              dateFormat="yyyy-MM-dd"
              isClearable={true}
            />
            {!editingHoliday && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only future dates are allowed
              </p>
            )}
          </div>
          <div>
            <FormLabel label="Reason" required />
            <div className="relative">
              <TextField
                type="text"
                name="price"
                value={reason}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setReason(e.target.value)
                }
                placeholder="E.g. Special Day"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              disabled={loadingStates.submittingForm}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loadingStates.submittingForm || !date || !reason}
            >
              {loadingStates.submittingForm ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : editingHoliday ? (
                "Update Holiday"
              ) : (
                "Add Holiday"
              )}
            </Button>
          </div>
        </form>
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
              disabled={loadingStates.deletingHoliday}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteHoliday}
              disabled={loadingStates.deletingHoliday}
            >
              Delete
            </Button>
          </div>
        }
      >
        {error && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this holiday? This action cannot be
          undone.
        </p>
      </CommonDialog>

      <div className="mt-8">
        {loadingStates.fetchingHolidays ? (
          <LoadingTable />
        ) : tableData.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No holidays found.
            </p>
          </div>
        ) : (
          <div
            className={
              loadingStates.deletingHoliday
                ? "pointer-events-none opacity-50"
                : ""
            }
          >
            <Table
              columns={columns}
              data={tableData}
              className="dark:divide-gray-700"
            />

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddHolidayPage;
