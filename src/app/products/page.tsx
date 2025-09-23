"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { deleteProduct, getAllProducts, updateProduct } from "@/services/CreateProductService";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";

type Product = {
  _id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  images: string[];
  sku?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
};

type ProductWithId = Product & { id: string };

type LoadingStates = {
  fetchingProducts: boolean;
  deletingProduct: boolean;
};

const ProductListPage: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingProducts: false,
    deletingProduct: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };
   
  const debounceSearch = useDebounce<string>(search , 300)

  const loadProducts = useCallback(async () => {
    updateLoadingState("fetchingProducts", true);
    try {
      const filter = { page: currentPage, limit: itemsPerPage , search:debounceSearch };
      const data = await getAllProducts(filter);
      const { items, pagination } = data.data;
      setProducts(items as Product[]);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to load products",
      });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  }, [currentPage, itemsPerPage ,debounceSearch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // confirm delete
  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    updateLoadingState("deletingProduct", true);
    try {
      await deleteProduct(deleteProductId);
      Toast({ type: "success", message: "Product deleted successfully!" });
      handleCloseDeleteDialog();
      await loadProducts();
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to delete product",
      });
    } finally {
      updateLoadingState("deletingProduct", false);
    }
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/create-product?id=${product._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteProductId(null);
  };

  const tableData: ProductWithId[] = products.map((p) => ({ ...p, id: p._id }));

  const handleToggleActive = async (product: Product) => {
    const updatedStatus = !product.isActive;

    try {
      await updateProduct(product._id, { isActive: updatedStatus });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id ? { ...p, isActive: updatedStatus } : p,
        ),
      );

      Toast({
        type: "success",
        message: `Product ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      Toast({
        type: "error",
        message:
          e?.response?.data?.errorData || "Failed to update product status",
      });
    }
  };

  const columns: Column<ProductWithId>[] = [
    { 
      title: "Sr.No", 
      key: "index", 
      width: "60px",
      render: (_, i) => i + 1 
    },
    {
      title: "Image",
      key: "images",
      width: "80px",
      render: (item) => (
        <div className="h-12 w-12 sm:h-16 sm:w-16">
          <Image
            src={getProductImageUrl(item.images?.[0])}
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
      width: "150px",
      render: (item) => (
        <div className="truncate max-w-[150px]" title={item.name}>
          {item.name}
        </div>
      )
    },
    {
      title: "Category",
      key: "category",
      width: "100px",
      align: "center",
      render: (item) => (
        <span className="text-xs sm:text-sm">
          {item.category?.toUpperCase() || ""}
        </span>
      ),
    },
    { 
      title: "Brand", 
      key: "brand",
      width: "100px",
      align: "center",
      render: (item) => (
        <div className="truncate max-w-[100px]" title={item.brand}>
          {item.brand}
        </div>
      )
    },
    { 
      title: "SKU", 
      key: "sku",
      align: "center",
      width: "120px",
      render: (item) => (
        <div className="text-xs" title={item.sku}>
          {item.sku}
        </div>
      )
    },
    { 
      title: "Price", 
      key: "price", 
      width: "80px",
      align: "center",
      render: (item) => (
        <span className="font-semibold">
          ${item.price}
        </span>
      )
    },
    { 
      title: "Stock", 
      key: "stock",
      width: "60px",
      align: "center",
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.stock > 10 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : item.stock > 0 
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {item.stock}
        </span>
      )
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
            onClick={() => handleEditProduct(item)}
            title="Edit product"
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteProductId(item._id);
              setShowDeleteDialog(true);
            }}
            title="Delete product"
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
        <h1 className="text-2xl font-semibold text-primary dark:text-white">
          Manage Products
        </h1>
        <Button onClick={() => router.push("/create-product")}>
          Create New Product
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
            <Button variant="danger" onClick={confirmDeleteProduct}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this product?
        </p>
      </CommonDialog>

      {/* Table */}
      <div>
        <Table columns={columns} data={tableData} />
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
