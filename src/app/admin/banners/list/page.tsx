"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit, MdDragIndicator } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import { Toast } from "@/components/ui/Toast";
import {
  deleteBanner,
  getAllBanners,
  updateBanner,
  updateBannerSequence,
} from "@/services/BannerService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import { calculatePageAfterDeletion } from "@/utils/paginationUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Banner = {
  _id: string;
  laptopImage: string;
  mobileImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sequence?: number;
};

type BannerWithId = Banner & { id: string };

type LoadingStates = {
  fetchingBanners: boolean;
  deletingBanner: boolean;
};

// Sortable Row Component
function SortableRow({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    position: isDragging ? "relative" : "static",
  } as React.CSSProperties;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 transition-colors duration-200 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${isDragging ? "bg-gray-100 opacity-80 dark:bg-gray-800" : ""
        }`}
    >
      <td
        className="cursor-move px-4 py-3 text-center"
        {...attributes}
        {...listeners}
      >
        <MdDragIndicator className="mx-auto text-xl text-gray-400" />
      </td>
      {children}
    </tr>
  );
}

const BannerListPage: React.FC = () => {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalBanners, setTotalBanners] = useState<number>(0);

  // Image preview states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [imageType, setImageType] = useState<"laptop" | "mobile">("laptop");

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingBanners: false,
    deletingBanner: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const debounceSearch = useDebounce<string>(search, 300);

  const loadBanners = useCallback(async () => {
    updateLoadingState("fetchingBanners", true);
    try {
      // Use backend filtering instead of client-side filtering
      const filter: any = {};
      if (statusFilter !== "All") {
        filter.isActive = statusFilter === "Active";
      }
      const data = await getAllBanners(filter);
      setBanners(data.data);
      // Since we're not paginating, set totalPages to 1
      setTotalPages(1);
      setTotalBanners(data.data.length);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.message || "Failed to load banners",
      });
    } finally {
      updateLoadingState("fetchingBanners", false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // confirm delete
  const confirmDeleteBanner = async () => {
    if (!deleteBannerId) return;

    // Check if this is the last active banner
    const bannerToDelete = banners.find(
      (banner) => banner._id === deleteBannerId
    );
    if (bannerToDelete?.isActive) {
      const activeBannersCount = banners.filter(
        (banner) => banner.isActive
      ).length;
      if (activeBannersCount <= 1) {
        Toast({
          type: "error",
          message:
            "Cannot delete the last active banner. At least one banner must remain active.",
        });
        handleCloseDeleteDialog();
        return;
      }
    }

    updateLoadingState("deletingBanner", true);
    try {
      await deleteBanner(deleteBannerId);
      Toast({ type: "success", message: "Banner deleted successfully!" });
      handleCloseDeleteDialog();

      // Check if we need to navigate to the previous page
      const newPage = calculatePageAfterDeletion(
        tableData.length,
        currentPage,
        totalPages
      );
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      } else {
        await loadBanners();
      }
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.message || "Failed to delete banner",
      });
    } finally {
      updateLoadingState("deletingBanner", false);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    // For now, we'll redirect to the create page with an ID parameter
    // In a future enhancement, we could create a dedicated edit page
    router.push(`/admin/banners?id=${banner._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteBannerId(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  // Image preview handlers
  const handleOpenImagePreview = (
    banner: Banner,
    type: "laptop" | "mobile"
  ) => {
    setPreviewBanner(banner);
    setImageType(type);
    setShowImagePreview(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewBanner(null);
  };

  const tableData: BannerWithId[] = (banners || []).map((p) => ({
    ...p,
    id: p._id,
  }));

  const handleToggleActive = async (banner: Banner) => {
    if (banner.isActive) {
      const activeBannersCount = banners.filter((b) => b.isActive).length;
      if (activeBannersCount <= 1) {
        Toast({
          type: "error",
          message:
            "Cannot deactivate the last active banner. At least one banner must remain active.",
        });
        return;
      }
    }

    const bannerId = banner._id;
    const previousStatus = banner.isActive;
    const updatedStatus = !previousStatus;

    // Optimistic UI update - immediately update the UI
    setBanners((prev) =>
      prev.map((p) =>
        p._id === bannerId ? { ...p, isActive: updatedStatus } : p
      )
    );

    try {
      // Make the API call
      await updateBanner(bannerId, { isActive: updatedStatus });

      Toast({
        type: "success",
        message: `Banner ${updatedStatus ? "activated" : "deactivated"
          } successfully!`,
      });
    } catch (e: any) {
      // Revert the optimistic update if the API call fails
      setBanners((prev) =>
        prev.map((p) =>
          p._id === bannerId ? { ...p, isActive: previousStatus } : p
        )
      );

      Toast({
        type: "error",
        message: e?.response?.data?.message || "Failed to update banner status",
      });
    }
  };

  const getFullImageUrl = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return `${baseUrl}${imagePath}`;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Call API to update sequence
        const bannerIds = newItems.map((b) => ({ _id: b._id }));
        updateBannerSequence(bannerIds).catch((err) => {
          console.error("Failed to update sequence", err);
          Toast({ type: "error", message: "Failed to update sequence" });
        });

        return newItems;
      });
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Banners ({totalBanners || 0})
        </h1>
        <Button
          onClick={() => router.push("/admin/banners")}
          className="w-full sm:w-auto"
        >
          Create New Banner
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <div className="flex w-full items-end gap-3">
          <div className="w-full sm:w-1/4">
            <Select
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "All" },
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ]}
            />
          </div>
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteBanner}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this banner? This action cannot be
          undone.
        </p>
      </CommonDialog>

      {/* Image Preview Dialog */}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={handleCloseImagePreview}
        size="lg"
      >
        {previewBanner && (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-4xl">
              {imageType === "laptop" ? (
                previewBanner.laptopImage.match(
                  /\.(mp4|webm|ogg|mov)$/i
                ) ? (
                  <video
                    src={getFullImageUrl(previewBanner.laptopImage)}
                    controls
                    autoPlay
                    loop
                    className="max-h-[70vh] w-full rounded-lg object-contain"
                  />
                ) : (
                  <Image
                    src={getFullImageUrl(previewBanner.laptopImage)}
                    alt="Laptop Banner"
                    width={800}
                    height={600}
                    className="max-h-[70vh] w-full rounded-lg object-contain"
                  />
                )
              ) : previewBanner.mobileImage.match(
                /\.(mp4|webm|ogg|mov)$/i
              ) ? (
                <video
                  src={getFullImageUrl(previewBanner.mobileImage)}
                  controls
                  autoPlay
                  loop
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              ) : (
                <Image
                  src={getFullImageUrl(previewBanner.mobileImage)}
                  alt="Mobile Banner"
                  width={400}
                  height={600}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              )}
            </div>

            <div className="mt-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
              {imageType === "laptop" ? "Laptop" : "Mobile"}{" "}
              {previewBanner.laptopImage.match(/\.(mp4|webm|ogg|mov)$/i) ||
                previewBanner.mobileImage.match(/\.(mp4|webm|ogg|mov)$/i)
                ? "Video"
                : "Image"}
            </div>
          </div>
        )}
      </CommonDialog>

      <div className="overflow-x-auto">
        {loadingStates.fetchingBanners || loadingStates.deletingBanner ? (
          <Skeleton />
        ) : tableData.length === 0 && !loadingStates.fetchingBanners ? (
          <EmptyState message="No banners found." />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full overflow-x-auto rounded-t-lg">
              <table className="w-full table-auto rounded-t-lg">
                <thead className="bg-lightblue dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[50px]">
                      Move
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[60px]">
                      Sr.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[120px]">
                      Laptop Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[80px]">
                      Mobile Image
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[100px]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <SortableContext
                  items={tableData.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="border-t border-b border-gray-200 bg-white overflow-auto dark:border-gray-700 dark:bg-gray-900">
                    {tableData.map((item, i) => (
                      <SortableRow key={item.id} id={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                          {(currentPage - 1) * 10 + i + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                          <div
                            className="h-16 w-16 cursor-pointer overflow-hidden rounded bg-gray-100"
                            onClick={() =>
                              handleOpenImagePreview(item, "laptop")
                            }
                          >
                            {(item.laptopImage &&
                              item.laptopImage.includes(".mp4")) ||
                              item.laptopImage?.match(
                                /\.(mp4|webm|ogg)$/i
                              ) ? (
                              <video
                                src={getFullImageUrl(item.laptopImage)}
                                className="h-full w-full object-cover"
                                muted
                                loop
                                playsInline
                              />
                            ) : (
                              <Image
                                src={getFullImageUrl(item.laptopImage)}
                                alt="Laptop Banner"
                                width={64}
                                height={64}
                                className="h-full w-full rounded object-cover"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                          <div
                            className="h-16 w-16 cursor-pointer overflow-hidden rounded bg-gray-100"
                            onClick={() =>
                              handleOpenImagePreview(item, "mobile")
                            }
                          >
                            {(item.mobileImage &&
                              (item.mobileImage.includes(".mp4") ||
                                item.mobileImage.includes(".mov") ||
                                item.mobileImage.match(
                                  /\.(mp4|webm|ogg|mov)$/i
                                ))) ? (
                              <video
                                src={getFullImageUrl(item.mobileImage)}
                                className="h-full w-full object-cover"
                                muted
                                loop
                                playsInline
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => e.currentTarget.pause()}
                              />
                            ) : (
                              <Image
                                src={getFullImageUrl(item.mobileImage)}
                                alt="Mobile Banner"
                                width={64}
                                height={64}
                                className="h-full w-full rounded object-cover"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-300">
                          <Badge
                            label={item.isActive ? "Active" : "Inactive"}
                            color={item.isActive ? "green" : "red"}
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-200">
                          <div className="flex items-center justify-end space-x-2">
                            <Tooltip content="Edit banner">
                              <MdModeEdit
                                size={16}
                                className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                onClick={() => handleEditBanner(item)}
                                title="Edit banner"
                              />
                            </Tooltip>
                            <Tooltip content="Delete banner">
                              <FiTrash2
                                size={16}
                                className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
                                onClick={() => {
                                  setDeleteBannerId(item._id);
                                  setShowDeleteDialog(true);
                                }}
                                title="Delete banner"
                              />
                            </Tooltip>
                            <Tooltip
                              content={
                                item.isActive ? "Activate" : "Deactivate"
                              }
                            >
                              <ToggleSwitch
                                checked={item.isActive}
                                onChange={() => handleToggleActive(item)}
                              />
                            </Tooltip>
                          </div>
                        </td>
                      </SortableRow>
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default BannerListPage;