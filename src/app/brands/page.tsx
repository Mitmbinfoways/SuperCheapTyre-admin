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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

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
      };
      const data = await getAllBrands(filter);
      const { items, pagination } = data.data;
      console.log(items);
      setBrands(items as Brand[]);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to load brands",
      });
    } finally {
      updateLoadingState("fetchingBrands", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

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
      await loadBrands();
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
    router.push(`/create-brand?id=${brand._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteBrandId(null);
  };

  const tableData: BrandWithId[] = brands.map((p) => ({ ...p, id: p._id }));

  const handleToggleActive = async (brand: Brand) => {
    const updatedStatus = !brand.isActive;

    try {
      await updateBrand(brand._id, { isActive: updatedStatus });
      setBrands((prev) =>
        prev.map((p) =>
          p._id === brand._id ? { ...p, isActive: updatedStatus } : p,
        ),
      );

      Toast({
        type: "success",
        message: `Brand ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
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
      render: (_, i) => i + 1,
    },
    {
      title: "Image",
      key: "image",
      width: "80px",
      render: (item) => {
        return (
          <div className="h-12 w-12 sm:h-16 sm:w-16">
            <Image
              src={getBrandImageUrl(item.image)}
              alt={item.name}
              width={50}
              height={50}
              className="h-full w-full rounded object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.png"; // Fallback image
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
        <div className="max-w-[150px] truncate" title={item.name}>
          {item.name}
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
            onClick={() => handleEditBrand(item)}
            title="Edit brand"
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteBrandId(item._id);
              setShowDeleteDialog(true);
            }}
            title="Delete brand"
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Brands
        </h1>
        <Button onClick={() => router.push("/create-brand")}>
          Create New Brand
        </Button>
      </div>

      <div className="w-1/3">
        <TextField
          type="text"
          className="mb-4"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* Delete Confirmation */}
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

      {/* Table */}
      <div className="h-[calc(100vh-200px)]">
        {loadingStates.fetchingBrands ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 rounded bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        ) : tableData.length === 0 ? (
          <EmptyState message="No brands found." className="h-full" />
        ) : (
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex justify-center">
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
