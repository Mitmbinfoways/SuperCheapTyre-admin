'use client'

import { useState, useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";
import { GetAllAppointments, Appointment } from "@/services/AppointmentService";
import Pagination from "@/components/ui/Pagination";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import Table, { Column } from "@/components/ui/table";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);

  const columns: Column<Appointment>[] = [
    {
      title: "Name",
      key: "name",
      render: (item) => `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim(),
    },
    { title: "Email", key: "email", render: (item) => item.email },
    { title: "Phone", key: "phone", render: (item) => item.phone },
    { title: "Date", key: "date", render: (item) => new Date(item.date).toLocaleDateString() },
    { title: "Status", key: "status", render: (item) => item.status },
    { title: "Notes", key: "notes", render: (item) => item.notes },
  ];

  const fetchAppointments = async () => {
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
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, debounceSearch]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-white">
        Appointments
      </h1>

      <div className="w-1/3 mb-4">
        <TextField
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 rounded bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No appointments found.
        </div>
      ) : (
        <>
          <Table columns={columns} data={appointments} className="dark:divide-gray-700" />
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
  );
};

export default AppointmentsPage;
