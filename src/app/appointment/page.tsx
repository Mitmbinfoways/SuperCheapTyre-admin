"use client";

import { useState, useEffect, useCallback } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
  GetAllAppointments,
  Appointment,
  updateAppointment,
} from "@/services/AppointmentService";
import Pagination from "@/components/ui/Pagination";
import { RxCross2 } from "react-icons/rx";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import Table, { Column } from "@/components/ui/table";
import { MdModeEdit } from "react-icons/md";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/EmptyState";
import { GetTechnicians } from "@/services/TechnicianService";
import Badge from "@/components/ui/Badge";

interface ExtendedAppointment extends Appointment {
  Employee?: string;
  slotDetails: {
    startTime: string;
    endTime: string;
    isBreak: boolean;
  };
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [technicianOptions, setTechnicianOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const itemsPerPage = 10;

  console.log(appointments);

  const debounceSearch = useDebounce<string>(search, 300);

  const [allTechnicians, setAllTechnicians] = useState<
    { label: string; value: string }[]
  >([]);

  const loadTechnicians = useCallback(async () => {
    try {
      const data = await GetTechnicians();
      const { items } = data.data;

      // Create a unified list for all technicians
      const allOptions = items.map((tech: any) => ({
        label: `${tech.firstName} ${tech.lastName}`,
        value: tech._id,
        isActive: tech.isActive,
      }));

      // Separate active ones for dropdown
      const activeOptions = allOptions.filter((tech) => tech.isActive);

      setAllTechnicians(allOptions);
      setTechnicianOptions(activeOptions);
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.errorData || "Failed to load technicians";
      setError(errorMessage);
      Toast({
        message: errorMessage,
        type: "error",
      });
    }
  }, []);

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
      const errorMessage =
        err?.response?.data?.message || "Failed to load appointments";
      setError(errorMessage);
      Toast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  const handleEmployeeAssignment = useCallback(
    async (appointmentId: string, employeeId: string) => {
      try {
        await updateAppointment(appointmentId, { Employee: employeeId });

        const updatedAppointments = appointments.map((appt) =>
          appt._id === appointmentId ? { ...appt, Employee: employeeId } : appt,
        );
        setAppointments(updatedAppointments);
        setEditingId(null);

        Toast({
          message: "Employee assigned successfully",
          type: "success",
        });
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || "Failed to assign employee";
        Toast({
          message: errorMessage,
          type: "error",
        });
      }
    },
    [appointments],
  );

  const columns: Column<ExtendedAppointment>[] = [
    {
      title: "Name",
      key: "name",
      render: (item) =>
        `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim() || "-",
    },
    {
      title: "Email",
      key: "email",
      render: (item) => item.email || "-",
    },
    {
      title: "Phone",
      key: "phone",
      render: (item) => item.phone || "-",
    },
    {
      title: "Date",
      key: "date",
      render: (item) =>
        item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    {
      title: "Time",
      key: "slotDetails",
      render: (item) =>
        item.slotDetails ? (
          <span>
            {item.slotDetails.startTime} - {item.slotDetails.endTime}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Status",
      key: "status",
      render: (item) => <Badge label={item.status || "-"} color="green" />,
    },
    {
      title: "Notes",
      key: "notes",
      render: (item) => <div className="line-clamp-2">{item.notes || "-"}</div>,
    },
    {
      title: "Assign Employee",
      key: "employee",
      align: "center",
      render: (item) =>
        editingId === item._id ? (
          <Select
            options={technicianOptions}
            value={item.Employee || ""}
            placeholder="Select Employee"
            onChange={(value) => handleEmployeeAssignment(item._id, value)}
          />
        ) : (
          <span className="text-sm">
            {item.Employee
              ? allTechnicians.find((opt) => opt.value === item.Employee)
                  ?.label || "Unknown Employee"
              : "-"}
          </span>
        ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          {editingId === item._id ? (
            <>
              <button
                onClick={() => setEditingId(null)}
                className="cursor-pointer text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Cancel edit"
              >
                <RxCross2 size={22} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingId(item._id)}
              className="cursor-pointer text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              aria-label="Edit appointment"
            >
              <MdModeEdit size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounceSearch]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-gray-300">
        Appointments
      </h1>

      <div className="mb-4 w-full sm:w-1/2 lg:w-1/3">
        <TextField
          type="text"
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
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
          <EmptyState message="No appointments found." />
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
