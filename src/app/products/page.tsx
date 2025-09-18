"use client";

import React, { useEffect, useState } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { deleteProduct, getAllProducts } from "@/services/CreateProductService";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

  const loadProducts = async () => {
    updateLoadingState("fetchingProducts", true);
    try {
      const filter = { page: currentPage, limit: itemsPerPage };
      const data = await getAllProducts(filter);
      const { items, pagination } = data.data;
      setProducts(items as Product[]);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      Toast({ type: "error", message: e?.response?.data?.errorData || "Failed to load products" });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentPage, itemsPerPage]);

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
      Toast({ type: "error", message: e?.response?.data?.errorData || "Failed to delete product" });
    } finally {
      updateLoadingState("deletingProduct", false);
    }
  };

  const handleEditProduct = (product: Product) => {
    // Redirect to create-product page with id for editing
    router.push(`/create-product?id=${product._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteProductId(null);
  };

  const tableData: ProductWithId[] = products.map((p) => ({ ...p, id: p._id }));

  const columns: Column<ProductWithId>[] = [
    { title: "Index", key: "index", render: (_, i) => i + 1 },
    {
      title: "Image",
      key: "images",
      render: (item) => (
        <div className="h-16 w-16">
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
    { title: "Name", key: "name" },
    {
      title: "Category",
      key: "category",
      render: (item) => item.category?.toUpperCase() || "",
    },
    { title: "Brand", key: "brand" },
    { title: "SKU", key: "sku" },
    { title: "Price", key: "price", render: (item) => `$${item.price}` },
    { title: "Stock", key: "stock" },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end space-x-3">
          <MdModeEdit
            size={16}
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => handleEditProduct(item)}
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteProductId(item._id);
              setShowDeleteDialog(true);
            }}
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
        <Button onClick={() => router.push("/create-product")}>Create New Product</Button>
      </div>

      {/* Product Form Dialog removed in favor of redirect-based editing */}

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
      <div className="mt-8">
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
