"use client";

import { useState, useEffect, useCallback } from "react";
import useDebounce from "@/hooks/useDebounce";
import { GetAllAppointments, Appointment } from "@/services/AppointmentService";
import Pagination from "@/components/ui/Pagination";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import Table, { Column } from "@/components/ui/table";
import { MdModeEdit } from "react-icons/md";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/EmptyState";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);

  // const employeeOptions = [
  //   { label: "John Doe", value: "1" },
  //   { label: "Jane Smith", value: "2" },
  //   { label: "Mike Johnson", value: "3" },
  // ];

  const columns: Column<Appointment>[] = [
    {
      title: "Name",
      key: "name",
      render: (item) => `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim(),
    },
    { title: "Email", key: "email", render: (item) => item.email },
    { title: "Phone", key: "phone", render: (item) => item.phone },
    {
      title: "Date",
      key: "date",
      render: (item) => new Date(item.date).toLocaleDateString(),
    },
    { title: "Status", key: "status", render: (item) => item.status },
    { title: "Notes", key: "notes", render: (item) => item.notes },
    // {
    //   title: "Assign Employee",
    //   key: "employee",
    //   align: "center",
    //   render: (item) =>
    //     editingId === item._id ? (
    //       <Select
    //         options={employeeOptions}
    //         value={item.value || ""}
    //         placeholder="Select Employee"
    //         onChange={(value) => {
    //           const updatedAppointments = appointments.map((appt) =>
    //             appt._id === item._id
    //               ? { ...appt, assignedEmployeeId: value }
    //               : appt,
    //           );
    //           setAppointments(updatedAppointments);
    //           setEditingId(null);
    //         }}
    //       />
    //     ) : (
    //       employeeOptions.find((opt) => opt.value === item.assignedEmployeeId)
    //         ?.label || "-"
    //     ),
    // },
    {
      title: "Action",
      key: "action",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          <MdModeEdit
            size={16}
            onClick={() => setEditingId(item._id)} // 👈 toggle edit mode
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          />
        </div>
      ),
    },
  ];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GetAllAppointments({
        currentPage,
        itemsPerPage,
        search: debounceSearch,
      });
      setAppointments(res.data.items);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      setError("Failed to load appointments");
      Toast({
        message: err?.response?.data?.message || "Failed to load appointments",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-gray-300">
        Appointments
      </h1>

      <div className="mb-4 w-1/3">
        <TextField
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="h-[calc(100vh-200px)]">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState message="No appointments found." className="h-full" />
        ) : (
          <>
            <Table
              columns={columns}
              data={appointments}
              className="dark:divide-gray-700"
            />
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
