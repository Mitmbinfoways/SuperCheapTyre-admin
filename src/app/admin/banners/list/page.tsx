"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import {
  deleteBanner,
  getAllBanners,
  updateBanner,
} from "@/services/BannerService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { EyeIcon } from "@/components/Layouts/sidebar/icons";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

type Banner = {
  _id: string;
  laptopImage: string;
  mobileImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type BannerWithId = Banner & { id: string };

type LoadingStates = {
  fetchingBanners: boolean;
  deletingBanner: boolean;
};

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

  // Image preview states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [imageType, setImageType] = useState<'laptop' | 'mobile'>('laptop');

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingBanners: false,
    deletingBanner: false,
  });

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
    const bannerToDelete = banners.find(banner => banner._id === deleteBannerId);
    if (bannerToDelete?.isActive) {
      const activeBannersCount = banners.filter(banner => banner.isActive).length;
      if (activeBannersCount <= 1) {
        Toast({
          type: "error",
          message: "Cannot delete the last active banner. At least one banner must remain active.",
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
      await loadBanners();
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
    router.push(`/banners?id=${banner._id}`);
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
  const handleOpenImagePreview = (banner: Banner, type: 'laptop' | 'mobile') => {
    setPreviewBanner(banner);
    setImageType(type);
    setShowImagePreview(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewBanner(null);
  };

  const tableData: BannerWithId[] = (banners || []).map((p) => ({ ...p, id: p._id }));

  const handleToggleActive = async (banner: Banner) => {
    // If trying to deactivate and this is the last active banner, show error
    if (banner.isActive) {
      const activeBannersCount = banners.filter(b => b.isActive).length;
      if (activeBannersCount <= 1) {
        Toast({
          type: "error",
          message: "Cannot deactivate the last active banner. At least one banner must remain active.",
        });
        return;
      }
    }

    const updatedStatus = !banner.isActive;

    try {
      await updateBanner(banner._id, { isActive: updatedStatus });
      setBanners((prev) =>
        prev.map((p) =>
          p._id === banner._id ? { ...p, isActive: updatedStatus } : p,
        ),
      );

      Toast({
        type: "success",
        message: `Banner ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      Toast({
        type: "error",
        message:
          e?.response?.data?.message || "Failed to update banner status",
      });
    }
  };

  const getFullImageUrl = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return `${baseUrl}${imagePath}`;
  };

  const columns: Column<BannerWithId>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => ((currentPage - 1) * 10 + i + 1),
    },
    {
      title: "Laptop Image",
      key: "laptopImage",
      width: "120px",
      render: (item) => (
        <div
          className="h-16 w-16 cursor-pointer"
          onClick={() => handleOpenImagePreview(item, 'laptop')}
        >
          <Image
            src={getFullImageUrl(item.laptopImage)}
            alt="Laptop Banner"
            width={64}
            height={64}
            className="h-full w-full rounded object-cover"
          />
        </div>
      ),
    },
    {
      title: "Mobile Image",
      key: "mobileImage",
      width: "80px",
      render: (item) => (
        <div
          className="h-16 w-16 cursor-pointer"
          onClick={() => handleOpenImagePreview(item, 'mobile')}
        >
          <Image
            src={getFullImageUrl(item.mobileImage)}
            alt="Mobile Banner"
            width={64}
            height={64}
            className="h-full w-full rounded object-cover"
          />
        </div>
      ),
    },
    {
      title: "Status",
      key: "isActive",
      width: "100px",
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
          <MdModeEdit
            size={16}
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => handleEditBanner(item)}
            title="Edit banner"
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteBannerId(item._id);
              setShowDeleteDialog(true);
            }}
            title="Delete banner"
          />
          <ToggleSwitch
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Banners
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
        {/* <div className="w-full sm:w-1/3 sm:py-7">
          <TextField
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div> */}
        <div className="w-full flex items-end gap-3">
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
          Are you sure you want to delete this banner? This action cannot be undone.
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
            <div className="relative w-full flex justify-center items-center">
              <div className="flex justify-center items-center w-full">
                <Image
                  src={imageType === 'laptop' ?
                    getFullImageUrl(previewBanner.laptopImage) :
                    getFullImageUrl(previewBanner.mobileImage)}
                  alt={`${imageType === 'laptop' ? 'Laptop' : 'Mobile'} Banner`}
                  width={450}
                  height={450}
                  className="rounded-lg object-contain max-h-[60vh] rounded-xl"
                />
              </div>
            </div>

            <div className="mt-4 text-lg font-semibold">
              {imageType === 'laptop' ? 'Laptop Banner' : 'Mobile Banner'}
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
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BannerListPage;