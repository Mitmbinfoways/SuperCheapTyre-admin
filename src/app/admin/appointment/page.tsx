"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import CommonDialog from "@/components/ui/Dialogbox"; // Added CommonDialog import
import Tooltip from "@/components/ui/Tooltip";
import DatePicker from "@/components/ui/DatePicker";

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
  const [dateFilter, setDateFilter] = useState("all"); // Date filter state
  const [customStartDate, setCustomStartDate] = useState(""); // Custom start date
  const [customEndDate, setCustomEndDate] = useState(""); // Custom end date
  const itemsPerPage = 10;
  const [totalAppointments, setTotalAppointments] = useState<number>(0);

  // Function to format date for input without timezone issues
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const debounceSearch = useDebounce<string>(search, 300);

  // Filter appointments based on date filter
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    let filtered = [...appointments];

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(appointment => {
        if (!appointment.date) return false;

        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "today":
            return appointmentDate.getTime() === today.getTime();
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return appointmentDate.getTime() === yesterday.getTime();
          case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return appointmentDate.getTime() === tomorrow.getTime();
          case "thisWeek":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Sunday
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Saturday
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          case "thisMonth":
            return appointmentDate.getMonth() === today.getMonth() &&
              appointmentDate.getFullYear() === today.getFullYear();
          case "custom":
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              return appointmentDate >= startDate && appointmentDate <= endDate;
            }
            return true; // If no custom dates selected, show all
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (debounceSearch) {
      const searchLower = debounceSearch.toLowerCase();
      filtered = filtered.filter(appointment =>
        (appointment.firstname && appointment.firstname.toLowerCase().includes(searchLower)) ||
        (appointment.lastname && appointment.lastname.toLowerCase().includes(searchLower)) ||
        (appointment.email && appointment.email.toLowerCase().includes(searchLower)) ||
        (appointment.phone && appointment.phone.includes(searchLower))
      );
    }

    return filtered;
  }, [appointments, dateFilter, customStartDate, customEndDate, debounceSearch]);

  // Paginate filtered appointments
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Update total pages based on filtered appointments
  const filteredTotalPages = useMemo(() => {
    return Math.ceil(filteredAppointments.length / itemsPerPage);
  }, [filteredAppointments.length, itemsPerPage]);

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
      setTotalAppointments(res.data.pagination.totalItems || 0);
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
    [appointments, fetchAppointments],
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
      render: (item) => <div className="max-w-36 whitespace-nowrap overflow-hidden text-ellipsis">{item.email || "-"}</div>,
    },
    {
      title: "Phone",
      key: "phone",
      render: (item) => item.phone || "-",
    },
    {
      title: "Appointment Date",
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
    // {
    //   title: "Status",
    //   key: "status",
    //   render: (item) => <Badge label={item.status || "-"} color="green" />,
    // },
    {
      title: "Notes",
      key: "notes",
      render: (item) => <div className="max-w-[120px] line-clamp-2">{item.notes || "-"}</div>,
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
          <Tooltip
            content="View appointment">
            <button
              onClick={() => handleViewAppointment(item)}
              className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              aria-label="View appointment"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </Tooltip>
          {editingId === item._id ? (
            <>
              <Tooltip
                content="Close">
                <button
                  onClick={() => setEditingId(null)}
                  className="cursor-pointer text-red-600"
                  aria-label="Cancel edit"
                >
                  <RxCross2 size={22} />
                </button>
              </Tooltip>
            </>
          ) : (
            <Tooltip
              content="Edit Appointment">
              <button
                onClick={() => setEditingId(item._id)}
                className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                aria-label="Edit appointment"
              >
                <MdModeEdit size={16} />
              </button>
            </Tooltip>
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
  }, [debounceSearch, dateFilter, customStartDate, customEndDate]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-gray-300">
        Appointments ({dateFilter === "all" && !debounceSearch ? totalAppointments : filteredAppointments.length || 0})
      </h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

        {/* Search */}
        <div className="flex flex-col gap-1">
          <TextField
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex flex-col gap-1">
          <Select
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { label: "All", value: "all" },
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "Tomorrow", value: "tomorrow" },
              { label: "This Week", value: "thisWeek" },
              { label: "This Month", value: "thisMonth" },
              { label: "Custom Range", value: "custom" },
            ]}
            placeholder="Filter by date"
          />
        </div>

        {/* Start Date */}
        {dateFilter === "custom" && (
          <div className="flex gap-2 w-full">
            <DatePicker
              value={customStartDate ? new Date(customStartDate) : null}
              onChange={(date: Date | null) =>
                setCustomStartDate(date ? formatDateForInput(date) : "")
              }
              placeholder="Start date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"

            />
            <DatePicker
              value={customEndDate ? new Date(customEndDate) : null}
              onChange={(date: Date | null) =>
                setCustomEndDate(date ? formatDateForInput(date) : "")
              }
              placeholder="End date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"

            />
          </div>
        )}

      </div>


      <div>
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="py-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : (dateFilter === "all" && !debounceSearch ? appointments : paginatedAppointments).length === 0 ? (
          <EmptyState message="No appointments found." />
        ) : (
          <>
            <Table
              columns={columns}
              data={dateFilter === "all" && !debounceSearch ? appointments : paginatedAppointments}
              className="dark:divide-gray-700"
            />
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={dateFilter === "all" && !debounceSearch ? totalPages : filteredTotalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <CommonDialog
        isOpen={!!viewAppointment}
        onClose={handleCloseViewModal}
        title="Appointment Details"
        size="lg"
      >
        {viewAppointment && (
          <div className="space-y-4 text-base">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Name</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {`${viewAppointment.firstname ?? ""} ${viewAppointment.lastname ?? ""}`.trim() || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Email</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {viewAppointment.email || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {viewAppointment.phone || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Date</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {viewAppointment.date ? new Date(viewAppointment.date).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Time Slot</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {viewAppointment.slotDetails ?
                    `${viewAppointment.slotDetails.startTime} - ${viewAppointment.slotDetails.endTime}` :
                    "-"}
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Status</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  <Badge label={viewAppointment.status || "-"} color="green" />
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Assigned Technician</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                  {viewAppointment.technicianDetails ?
                    `${viewAppointment.technicianDetails.firstName} ${viewAppointment.technicianDetails.lastName}` :
                    "-"}
                </p>
              </div>
              <div className="md:col-span-2 max-h-56 overflow-y-auto">
                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
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