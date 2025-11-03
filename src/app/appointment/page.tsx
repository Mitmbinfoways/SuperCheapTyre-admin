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
import { EyeIcon } from "@/components/Layouts/sidebar/icons"; // Added EyeIcon import
import Select from "@/components/ui/Select";
import EmptyState from "@/components/EmptyState";
import { GetTechnicians } from "@/services/TechnicianService";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import CommonDialog from "@/components/ui/Dialogbox"; // Added CommonDialog import

interface ExtendedAppointment extends Appointment {
  Employee?: string;
  slotDetails: {
    startTime: string;
    endTime: string;
    isBreak: boolean;
  };
  technicianDetails: {
    firstName: string;
    lastName: string;
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
  const [viewAppointment, setViewAppointment] = useState<ExtendedAppointment | null>(null); // Added state for view appointment
  const itemsPerPage = 10;

  const debounceSearch = useDebounce<string>(search, 300);

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
      const activeOptions = allOptions.filter((tech) => tech.isActive);
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
        fetchAppointments();
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

  // Added function to handle view appointment
  const handleViewAppointment = (appointment: ExtendedAppointment) => {
    setViewAppointment(appointment);
  };

  // Added function to close view modal
  const handleCloseViewModal = () => {
    setViewAppointment(null);
  };

  const columns: Column<ExtendedAppointment>[] = [
    {
      title: "SR.NO",
      key: "index",
      render: (item, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
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
      render: (item) => <Tooltip content={item.notes || "-"} position="top"><div className="max-w-[120px] line-clamp-2">{item.notes || "-"}</div></Tooltip>,
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
            {item.technicianDetails
              ? `${item.technicianDetails.firstName} ${item.technicianDetails.lastName}`
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
          {/* Added View Icon */}
          <button
            onClick={() => handleViewAppointment(item)}
            className="cursor-pointer text-gray-600"
            aria-label="View appointment"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          {editingId === item._id ? (
            <>
              <button
                onClick={() => setEditingId(null)}
                className="cursor-pointer text-red-600"
                aria-label="Cancel edit"
              >
                <RxCross2 size={22} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingId(item._id)}
              className="cursor-pointer text-gray-600"
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
          <Skeleton />
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

      {/* Added View Appointment Modal */}
      <CommonDialog
        isOpen={!!viewAppointment}
        onClose={handleCloseViewModal}
        title="Appointment Details"
        size="lg"
      >
        {viewAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {`${viewAppointment.firstname ?? ""} ${viewAppointment.lastname ?? ""}`.trim() || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.email || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.phone || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.date ? new Date(viewAppointment.date).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Slot</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.slotDetails ? 
                    `${viewAppointment.slotDetails.startTime} - ${viewAppointment.slotDetails.endTime}` : 
                    "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <Badge label={viewAppointment.status || "-"} color="green" />
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Technician</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.technicianDetails ?
                    `${viewAppointment.technicianDetails.firstName} ${viewAppointment.technicianDetails.lastName}` :
                    "-"}
                </p>
              </div>
              <div className="md:col-span-2 max-h-56 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewAppointment.notes || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CommonDialog>
    </div>
  );
};

export default AppointmentsPage;