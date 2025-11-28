"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import { Toast } from "@/components/ui/Toast";
import {
    deleteService,
    getAllServices,
    updateService,
    Service,
} from "@/services/ServiceService";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/utils"; // Assuming this works for services too or I might need to adjust path
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";

type ServiceWithId = Service & { id: string };

type LoadingStates = {
    fetchingServices: boolean;
    deletingService: boolean;
};

const ServiceListPage: React.FC = () => {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        fetchingServices: false,
        deletingService: false,
    });

    const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
        setLoadingStates((prev) => ({ ...prev, [key]: value }));
    };

    const debounceSearch = useDebounce<string>(search, 300);

    const loadServices = useCallback(async () => {
        updateLoadingState("fetchingServices", true);
        try {
            // Client-side filtering for now as the API might not support search yet, 
            // or we can update API later. The current getAllServices only takes isActive.
            // We'll fetch all and filter here for simplicity if the list is small, 
            // or just show all.
            const data = await getAllServices({});
            let items = data.data || [];

            if (debounceSearch) {
                const lowerSearch = debounceSearch.toLowerCase();
                items = items.filter(s => s.name.toLowerCase().includes(lowerSearch));
            }

            setServices(items);
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to load services",
            });
        } finally {
            updateLoadingState("fetchingServices", false);
        }
    }, [debounceSearch]);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const handleEditService = (service: Service) => {
        router.push(`/admin/create-service?id=${service._id}`);
    };

    // confirm delete
    const confirmDeleteService = async () => {
        if (!deleteServiceId) return;
        updateLoadingState("deletingService", true);
        try {
            await deleteService(deleteServiceId);
            Toast({ type: "success", message: "Service deleted successfully!" });
            handleCloseDeleteDialog();
            await loadServices();
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to delete service",
            });
        } finally {
            updateLoadingState("deletingService", false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setShowDeleteDialog(false);
        setDeleteServiceId(null);
    };

    const tableData: ServiceWithId[] = services.map((s) => ({ ...s, id: s._id }));

    const handleToggleActive = async (service: Service) => {
        const serviceId = service._id;
        const previousStatus = service.isActive;
        const updatedStatus = !previousStatus;

        // Optimistic UI update
        setServices((prev) =>
            prev.map((s) =>
                s._id === serviceId ? { ...s, isActive: updatedStatus } : s,
            ),
        );

        try {
            await updateService(serviceId, { isActive: updatedStatus });

            Toast({
                type: "success",
                message: `Service ${updatedStatus ? "activated" : "deactivated"} successfully!`,
            });
        } catch (e: any) {
            // Revert
            setServices((prev) =>
                prev.map((s) =>
                    s._id === serviceId ? { ...s, isActive: previousStatus } : s,
                ),
            );

            Toast({
                type: "error",
                message:
                    e?.response?.data?.errorData || "Failed to update service status",
            });
        }
    };

    // Helper to get image URL (assuming same logic as products or generic)
    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return "/placeholder.png"; // Replace with actual placeholder
        if (imagePath.startsWith("http")) return imagePath;
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
        // Ensure no double slashes if imagePath starts with /
        const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
        // If getProductImageUrl handles this, we can use it, but let's be safe
        // The previous code used getProductImageUrl, let's assume it works for any public image
        return `${BASE_URL}${cleanPath}`;
    };

    const columns: Column<ServiceWithId>[] = [
        {
            title: "Sr.No",
            key: "index",
            width: "60px",
            render: (_, i) => i + 1,
        },
        {
            title: "Image",
            key: "images",
            width: "80px",
            render: (item) => (
                <div className="h-12 w-12 sm:h-16 sm:w-16">
                    <Image
                        src={getImageUrl(item.images?.[0])}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="h-full w-full rounded object-cover"
                    />
                </div>
            ),
        },
        {
            title: "Name",
            key: "name",
            width: "200px",
            render: (item) => (
                <div className="line-clamp-2" title={item.name}>
                    {item.name}
                </div>
            ),
        },
        {
            title: "Price",
            key: "price",
            width: "100px",
            align: "center",
            render: (item) => <span className="font-semibold">${item.price}</span>,
        },
        {
            title: "Status",
            key: "isActive",
            align: "center",
            render: (item) => (
                <Badge
                    label={item.isActive ? "Active" : "Inactive"}
                    color={item.isActive ? "green" : "red"}
                />
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: "120px",
            align: "center",
            render: (item) => (
                <div className="flex items-center justify-end space-x-2">
                    <Tooltip content="Edit Service">
                        <MdModeEdit
                            size={16}
                            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            onClick={() => handleEditService({ ...item } as Service)}
                        />
                    </Tooltip>
                    <Tooltip content="Delete Service">
                        <FiTrash2
                            size={16}
                            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
                            onClick={() => {
                                setDeleteServiceId(item._id);
                                setShowDeleteDialog(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip content={item.isActive ? "Deactivate" : "Activate"}>
                        <ToggleSwitch
                            checked={item.isActive}
                            onChange={() => handleToggleActive({ ...item } as Service)}
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
                    Manage Services ({services.length})
                </h1>
                <div className="flex gap-2">
                    <Button className="w-full sm:w-auto" onClick={() => router.push("/admin/create-service")}>
                        Create New Service
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex justify-between items-center gap-2">
                <TextField
                    type="text"
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-80"
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <CommonDialog
                isOpen={showDeleteDialog}
                onClose={handleCloseDeleteDialog}
                title="Confirm Delete"
                footer={
                    <div className="flex justify-end space-x-3">
                        <Button variant="secondary" onClick={handleCloseDeleteDialog}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDeleteService}>
                            {loadingStates.deletingService ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                }
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete this service? This action cannot be undone.
                </p>
            </CommonDialog>

            <div className="overflow-x-auto">
                {loadingStates.fetchingServices ? (
                    <Skeleton />
                ) : tableData.length === 0 ? (
                    <EmptyState message="No services found." />
                ) : (
                    <Table columns={columns} data={tableData} />
                )}
            </div>
        </div>
    );
};

export default ServiceListPage;
