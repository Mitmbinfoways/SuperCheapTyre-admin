"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
    GetAllAppointments,
    Appointment,
} from "@/services/AppointmentService";
import Pagination from "@/components/ui/Pagination";
import TextField from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import Table, { Column } from "@/components/ui/table";
import { EyeIcon } from "@/components/Layouts/sidebar/icons";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CommonDialog from "@/components/ui/Dialogbox";
import Tooltip from "@/components/ui/Tooltip";

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

const CustomerPage = () => {
    const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [viewCustomer, setViewCustomer] = useState<ExtendedAppointment | null>(null);
    const itemsPerPage = 10;
    const [totalCustomers, setTotalCustomers] = useState<number>(0);

    const debounceSearch = useDebounce<string>(search, 300);

    const fetchCustomers = useCallback(async () => {
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
            setTotalCustomers(res.data.pagination.totalItems || 0);
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || "Failed to load customers";
            setError(errorMessage);
            Toast({
                message: errorMessage,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, debounceSearch]);

    const handleViewCustomer = (customer: ExtendedAppointment) => {
        setViewCustomer(customer);
    };

    const handleCloseViewModal = () => {
        setViewCustomer(null);
    };

    const columns: Column<ExtendedAppointment>[] = [
        {
            title: "SR.NO",
            key: "index",
            render: (item, index) => (currentPage - 1) * itemsPerPage + index + 1,
        },
        {
            title: "Customer Name",
            key: "name",
            render: (item) =>
                `${item.firstname ?? ""} ${item.lastname ?? ""}`.trim() || "-",
        },
        {
            title: "Email",
            key: "email",
            render: (item) => <div className="line-clamp-2">{item.email || "-"}</div>,
        },
        {
            title: "Phone",
            key: "phone",
            render: (item) => item.phone || "-",
        },
        // {
        //     title: "Appointment Date",
        //     key: "date",
        //     render: (item) =>
        //         item.date ? new Date(item.date).toLocaleDateString() : "-",
        // },
        // {
        //     title: "Time Slot",
        //     key: "slotDetails",
        //     render: (item) =>
        //         item.slotDetails ? (
        //             <span>
        //                 {item.slotDetails.startTime} - {item.slotDetails.endTime}
        //             </span>
        //         ) : (
        //             "-"
        //         ),
        // },
        // {
        //     title: "Notes",
        //     key: "notes",
        //     render: (item) => <div className="max-w-[120px] line-clamp-2">{item.notes || "-"}</div>,
        // },
        {
            title: "Action",
            key: "action",
            align: "right",
            render: (item) => (
                <div className="flex items-center justify-end space-x-3">
                    <Tooltip
                        content="View Details">
                        <button
                            onClick={() => handleViewCustomer(item)}
                            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            aria-label="View details"
                        >
                            <EyeIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
            ),
        },
    ];

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debounceSearch]);

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
            <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-gray-300">
                Customers ({totalCustomers})
            </h1>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex flex-col gap-1">
                    <TextField
                        type="text"
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div>
                {loading ? (
                    <Skeleton />
                ) : error ? (
                    <div className="py-8 text-center text-red-600 dark:text-red-400">
                        {error}
                    </div>
                ) : appointments.length === 0 ? (
                    <EmptyState message="No customers found." />
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

            <CommonDialog
                isOpen={!!viewCustomer}
                onClose={handleCloseViewModal}
                title="Customer Details"
                size="lg"
            >
                {viewCustomer && (
                    <div className="space-y-4 text-base">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {`${viewCustomer.firstname ?? ""} ${viewCustomer.lastname ?? ""}`.trim() || "-"}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Email</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {viewCustomer.email || "-"}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {viewCustomer.phone || "-"}
                                </p>
                            </div>
                             {/* <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Appointment Date</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {viewCustomer.date ? new Date(viewCustomer.date).toLocaleDateString() : "-"}
                                </p>
                            </div> 
                             <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Time Slot</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {viewCustomer.slotDetails ?
                                        `${viewCustomer.slotDetails.startTime} - ${viewCustomer.slotDetails.endTime}` :
                                        "-"}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Status</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    <Badge label={viewCustomer.status || "-"} color="green" />
                                </p>
                            </div> 
                            <div className="md:col-span-2 max-h-56 overflow-y-auto">
                                <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                    {viewCustomer.notes || "-"}
                                </p>
                            </div> */}
                        </div>
                    </div>
                )}
            </CommonDialog>
        </div>
    );
};

export default CustomerPage;
