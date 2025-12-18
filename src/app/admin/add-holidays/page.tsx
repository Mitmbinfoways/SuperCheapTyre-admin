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
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";

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
  const [error, setError] = useState<{
    date?: string;
    reason?: string;
    apiError?: string;
  }>({});
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState<string>("");
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingHolidays: false,
    submittingForm: false,
    deletingHoliday: false,
  });
  const [totalHolidays, setTotalHolidays] = useState<number>(0);

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const debounceSearch = useDebounce<string>(search, 300);

  const tableData: HolidayWithId[] = holidays?.map((h) => ({
    ...h,
    id: h._id,
  }));

  const loadHolidays = useCallback(async () => {
    updateLoadingState("fetchingHolidays", true);
    setError({});
    try {
      const filter = {
        currentPage,
        itemsPerPage,
        search: debounceSearch,
      };
      const data = await GetHolidays(filter);
      const { items, pagination } = data.data;
      setHolidays(items);
      setTotalPages(pagination.totalPages);
      setTotalHolidays(pagination.totalItems);
    } catch (e: any) {
      setError({
        apiError: e?.response?.data?.errorData || "Failed to load holidays",
      });
    } finally {
      updateLoadingState("fetchingHolidays", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const formatToYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddHoliday = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError({});

    const newError: { date?: string; reason?: string } = {};

    if (!date) newError.date = "Date is required";
    if (!reason.trim()) newError.reason = "Reason is required";
    if (Object.keys(newError).length > 0) {
      setError(newError);
      return;
    }

    updateLoadingState("submittingForm", true);
    try {
      const payloadDate = formatToYmd(date as Date);
      if (editingHoliday) {
        await AddHoliday({ id: editingHoliday._id, date: payloadDate, reason });
        Toast({ type: "success", message: "Holiday updated successfully!" });
      } else {
        await AddHoliday({ date: payloadDate, reason });
        Toast({ type: "success", message: "Holiday added successfully!" });
      }
      handleCloseForm();
      await loadHolidays();
    } catch (e: any) {
      setError({
        apiError:
          e?.response?.data?.errorData ||
          "Something went wrong. Please try again",
      });
    } finally {
      updateLoadingState("submittingForm", false);
    }
  };

  const confirmDeleteHoliday = async () => {
    if (!deleteHolidayId) return;
    updateLoadingState("deletingHoliday", true);
    setError({});
    try {
      await DeleteHoliday(deleteHolidayId);
      Toast({ type: "success", message: "Holiday deleted successfully!" });
      handleCloseDeleteDialog();

      // Check if we're deleting the last item on the current page
      // and there are multiple pages
      if (tableData.length === 1 && currentPage > 1) {
        // If we're deleting the last item, go to the previous page
        setCurrentPage(prev => prev - 1);
      } else {
        // Otherwise, reload the current page
        await loadHolidays();
      }
    } catch (e: any) {
      setError({
        apiError: e.response?.data?.errorData || "Failed to delete holiday",
      });
    } finally {
      updateLoadingState("deletingHoliday", false);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setDate(new Date(holiday.date));
    setReason(holiday.reason);
    setShowForm(true);
    setError({});
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHoliday(null);
    setDate(null);
    setReason("");
    setError({});
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteHolidayId(null);
    setError({});
  };

  const columns: Column<HolidayWithId>[] = [
    { title: "Index", key: "index", render: (_, index) => (currentPage - 1) * itemsPerPage + index + 1 },
    {
      title: "Date",
      key: "date",
      render: (item) => new Date(item.date).toDateString(),
    },
    { title: "Reason", key: "reason" },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          <Tooltip content="Edit holiday">
            <MdModeEdit
              size={16}
              className={`cursor-pointer transition-colors ${loadingStates.fetchingHolidays || loadingStates.deletingHoliday
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
          </Tooltip>
          <Tooltip content="Delete holiday">
            <FiTrash2
              size={16}
              className={`cursor-pointer transition-colors ${loadingStates.fetchingHolidays || loadingStates.deletingHoliday
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
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Holidays ({totalHolidays || 0})
        </h1>
        <Button
          onClick={() => {
            setEditingHoliday(null);
            setDate(null);
            setReason("");
            setError({});
            setShowForm(true);
          }}
          className="w-full sm:w-auto"
        >
          Add Holiday
        </Button>
      </div>

      <div className="mb-4 sm:w-1/3">
        <TextField
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full"
        />
      </div>

      <CommonDialog
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
      >
        {error.apiError && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error.apiError}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleAddHoliday}>
          <div>
            <FormLabel label="Date" required />
            <DatePicker
              value={date}
              onChange={(d: Date | null) => setDate(d)}
              minDate={new Date()}
              placeholder="Select a date"
              dateFormat="yyyy-MM-dd"
              isClearable={true}
            />
            {error.date && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {error.date}
              </p>
            )}
          </div>

          <div>
            <FormLabel label="Reason" required />
            <TextField
              type="text"
              value={reason}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setReason(e.target.value)
              }
              error={error.reason}
              placeholder="E.g. Special Day"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="w-full sm:w-auto"
            >
              {loadingStates.submittingForm ? (
                <div className="flex items-center justify-center space-x-2">
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
              onClick={confirmDeleteHoliday}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        }
      >
        {error.apiError && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-300">
            {error.apiError}
          </div>
        )}
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this holiday? This action cannot be undone.
        </p>
      </CommonDialog>
      <div className="overflow-x-auto">
        {loadingStates.fetchingHolidays || loadingStates.deletingHoliday ? (
          <Skeleton />
        ) : tableData.length === 0 ? (
          <EmptyState message="No holidays found." />
        ) : (
          <div
            className={
              loadingStates.deletingHoliday ? "pointer-events-none opacity-50" : ""
            }
          >
            <Table columns={columns} data={tableData} className="dark:divide-gray-700" />
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:justify-center">
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
