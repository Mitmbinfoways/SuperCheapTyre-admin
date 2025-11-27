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
  getAllBrands,
  deleteBrand,
  updateBrand,
  Brand,
} from "@/services/BrandService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import { getBrandImageUrl } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import { calculatePageAfterDeletion } from "@/utils/paginationUtils";

type BrandWithId = Brand & { id: string };

type LoadingStates = {
  fetchingBrands: boolean;
  deletingBrand: boolean;
};

const BrandListPage: React.FC = () => {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState<number>(0);

  // Image preview states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewBrand, setPreviewBrand] = useState<Brand | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingBrands: false,
    deletingBrand: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const debounceSearch = useDebounce<string>(search, 300);

  const loadBrands = useCallback(async () => {
    updateLoadingState("fetchingBrands", true);
    try {
      const filter = {
        page: currentPage,
        limit: itemsPerPage,
        search: debounceSearch,
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        isActive: statusFilter !== "All" ? statusFilter === "Active" : undefined,
      };
      const data = await getAllBrands(filter);
      const { items, pagination } = data.data;
      setBrands(items as Brand[]);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to load brands",
      });
    } finally {
      updateLoadingState("fetchingBrands", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch, categoryFilter, statusFilter]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // confirm delete
  const confirmDeleteBrand = async () => {
    if (!deleteBrandId) return;
    updateLoadingState("deletingBrand", true);
    try {
      await deleteBrand(deleteBrandId);
      Toast({ type: "success", message: "Brand deleted successfully!" });
      handleCloseDeleteDialog();
      
      // Check if we need to navigate to the previous page
      const newPage = calculatePageAfterDeletion(tableData.length, currentPage, totalPages);
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      } else {
        await loadBrands();
      }
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to delete brand",
      });
    } finally {
      updateLoadingState("deletingBrand", false);
    }
  };

  const handleEditBrand = (brand: Brand) => {
    router.push(`/admin/create-brand?id=${brand._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteBrandId(null);
  };

  // Image preview handlers
  const handleOpenImagePreview = (brand: Brand) => {
    setPreviewBrand(brand);
    setShowImagePreview(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewBrand(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
  };

  const tableData: BrandWithId[] = brands.map((p) => ({ ...p, id: p._id }));

  const handleToggleActive = async (brand: Brand) => {
    const brandId = brand._id;
    const previousStatus = brand.isActive;
    const updatedStatus = !previousStatus;

    // Optimistic UI update - immediately update the UI
    setBrands((prev) =>
      prev.map((p) =>
        p._id === brandId ? { ...p, isActive: updatedStatus } : p,
      ),
    );

    try {
      // Make the API call
      await updateBrand(brandId, { isActive: updatedStatus });
    
      Toast({
        type: "success",
        message: `Brand ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      // Revert the optimistic update if the API call fails
      setBrands((prev) =>
        prev.map((p) =>
          p._id === brandId ? { ...p, isActive: previousStatus } : p,
        ),
      );
    
      Toast({
        type: "error",
        message:
          e?.response?.data?.errorData || "Failed to update brand status",
      });
    }
  };

  const columns: Column<BrandWithId>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => ((currentPage - 1) * 10 + i + 1),
    },
    {
      title: "Image",
      key: "image",
      width: "80px",
      render: (item) => {
        return (
          <div
            className="h-12 w-12 sm:h-20 sm:w-28 cursor-pointer"
            onClick={() => handleOpenImagePreview(item)}
          >
            <Image
              src={getBrandImageUrl(item.image)}
              alt={item.name}
              width={50}
              height={50}
              className="h-full w-full rounded object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.png";
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Name",
      key: "name",
      width: "150px",
      render: (item) => (
        <div className="line-clamp-2" title={item.name}>
          {item.name}
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      width: "150px",
      render: (item) => (
        <div className="line-clamp-2" title={item.category}>
          {item.category === "both" ? "TYRE & WHEEL" : item.category?.toUpperCase() || ""}
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
          <Tooltip content="Edit brand">
            <MdModeEdit
              size={16}
              className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              onClick={() => handleEditBrand(item)}
              title="Edit brand"
            />
          </Tooltip>
          <Tooltip content="Delete brand">
            <FiTrash2
              size={16}
              className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
              onClick={() => {
                setDeleteBrandId(item._id);
                setShowDeleteDialog(true);
              }}
              title="Delete brand"
            />
          </Tooltip>
          <Tooltip content={item.isActive ? "Activate" : "Deactivate"}>
          <ToggleSwitch
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
          />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Brands ({totalItems || 0})
        </h1>
        <Button
          onClick={() => router.push("/admin/create-brand")}
          className="w-full sm:w-auto"
        >
          Create New Brand
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-1/3 sm:py-7">
          <TextField
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Select
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { label: "All Categories", value: "All" },
              { label: "Tyre", value: "Tyre" },
              { label: "Wheel", value: "Wheel" },
              { label: "Tyre & Wheel", value: "Both" },
            ]}
          />
        </div>
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
        <div className="flex items-center">
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
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
            <Button variant="danger" onClick={confirmDeleteBrand}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this brand?
        </p>
      </CommonDialog>

      {/* Image Preview Dialog */}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={handleCloseImagePreview}
        size="lg"
      >
        <div className="flex justify-center">
          {previewBrand && (
            <Image
              src={getBrandImageUrl(previewBrand.image)}
              alt={previewBrand.name}
              width={500}
              height={500}
              className="rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </div>
      </CommonDialog>

      {/* Table */}
      <div className="overflow-x-auto">
        {loadingStates.fetchingBrands || loadingStates.deletingBrand ? (
          <Skeleton />
        ) : tableData.length === 0 ? (
          <EmptyState message="No brands found." />
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

export default BrandListPage;