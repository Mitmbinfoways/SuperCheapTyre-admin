"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiFilter, FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import {
  deleteProduct,
  getAllProducts,
  updateProduct,
  Product as ServiceProduct,
} from "@/services/CreateProductService";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Select from "@/components/ui/Select";
import { getAllBrands } from "@/services/BrandService";
import Tooltip from "@/components/ui/Tooltip";
import { calculatePageAfterDeletion } from "@/utils/paginationUtils";

type ProductWithId = ServiceProduct & { id: string };

type LoadingStates = {
  fetchingProducts: boolean;
  deletingProduct: boolean;
};

const ProductListPage: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPopularFilter, setIsPopularFilter] = useState<boolean | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ label: string, value: string }[]>([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalProduct, setTotalProduct] = useState<number>(0);

  // Filter popup state
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // Filter state for the popup (temporary until applied)
  const [tempSearch, setTempSearch] = useState("");
  const [tempCategoryFilter, setTempCategoryFilter] = useState("");
  const [tempBrandFilter, setTempBrandFilter] = useState("");
  const [tempStatusFilter, setTempStatusFilter] = useState("all");
  const [tempIsPopularFilter, setTempIsPopularFilter] = useState<boolean | null>(null);
  const [tempLowStockFilter, setTempLowStockFilter] = useState<boolean | null>(null);
  const [outOfStockFilter, setOutOfStockFilter] = useState<boolean | null>(null);
  const [tempOutOfStockFilter, setTempOutOfStockFilter] = useState<boolean | null>(null);

  // Check if any filters are currently applied
  const areFiltersApplied = () => {
    return (
      categoryFilter !== "" ||
      brandFilter !== "" ||
      statusFilter !== "all" ||
      isPopularFilter !== null ||
      lowStockFilter !== null ||
      outOfStockFilter !== null
    );
  };

  // Image preview states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<ServiceProduct | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingProducts: false,
    deletingProduct: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const debounceSearch = useDebounce<string>(search, 300);


  const fetchBrands = async () => {
    try {
      const res = await getAllBrands();
      const brandOptions = res.data.items
        .filter((brand) => brand.isActive)
        .map((brand) => ({
          label: brand.name,
          value: brand.name,
        }));
      setBrands(brandOptions);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      Toast({
        message: "Failed to load brands",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const loadProducts = useCallback(async () => {
    updateLoadingState("fetchingProducts", true);
    try {
      const filter = {
        page: currentPage,
        limit: itemsPerPage,
        search: debounceSearch,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
        isPopular: isPopularFilter !== null ? isPopularFilter : undefined,
        stock: outOfStockFilter === true ? "out-of-stock" : lowStockFilter === true ? "low-stock" : undefined,
      };
      const data = await getAllProducts(filter);
      const { items, pagination } = data.data;
      setProducts(items);
      setTotalPages(pagination.totalPages);
      setTotalProduct(pagination.totalItems);
      // Extract unique categories from the products
      const uniqueCategories = Array.from(new Set(items.map((p) => p.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to load products",
      });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch, categoryFilter, brandFilter, statusFilter, isPopularFilter, lowStockFilter, outOfStockFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleEditProduct = (product: ServiceProduct) => {
    router.push(`/create-product?id=${product._id}&page=${currentPage}`);
  };

  // confirm delete
  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    updateLoadingState("deletingProduct", true);
    try {
      await deleteProduct(deleteProductId);
      Toast({ type: "success", message: "Product deleted successfully!" });
      handleCloseDeleteDialog();

      // Check if we need to navigate to the previous page
      const newPage = calculatePageAfterDeletion(tableData.length, currentPage, totalPages);
      if (newPage !== currentPage) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("page", String(newPage));
        router.push(`${pathname}?${current.toString()}`);
      } else {
        await loadProducts();
      }
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to delete product",
      });
    } finally {
      updateLoadingState("deletingProduct", false);
    }
  };

  const handlePageChange = (page: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", String(page));
    router.push(`${pathname}?${current.toString()}`);
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteProductId(null);
  };

  // Filter popup handlers
  const handleOpenFilterPopup = () => {
    // Initialize temporary filter state with current values
    setTempSearch(search);
    setTempCategoryFilter(categoryFilter);
    setTempBrandFilter(brandFilter);
    setTempStatusFilter(statusFilter);
    setTempIsPopularFilter(isPopularFilter);
    setTempLowStockFilter(lowStockFilter);
    setTempOutOfStockFilter(outOfStockFilter);
    setShowFilterPopup(true);
  };

  const handleCloseFilterPopup = () => {
    setShowFilterPopup(false);
  };

  const handleApplyFilters = () => {
    // Apply temporary filter values to actual filter state
    setSearch(tempSearch);
    setCategoryFilter(tempCategoryFilter);
    setBrandFilter(tempBrandFilter);
    setStatusFilter(tempStatusFilter);
    setIsPopularFilter(tempIsPopularFilter);
    setLowStockFilter(tempLowStockFilter);
    setOutOfStockFilter(tempOutOfStockFilter);
    setShowFilterPopup(false);

    // Reset to first page when filters change
    // Reset to first page when filters change
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", "1");
    router.push(`${pathname}?${current.toString()}`);
  };

  const handleResetFilters = () => {
    // Reset temporary filter state
    setTempSearch("");
    setTempCategoryFilter("");
    setTempBrandFilter("");
    setTempStatusFilter("all");
    setTempIsPopularFilter(null);
    setTempLowStockFilter(null);
    setTempOutOfStockFilter(null);

    // Also reset the actual filter state
    setSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("all");
    setIsPopularFilter(null);
    setLowStockFilter(null);
    setOutOfStockFilter(null);

    // Reset to first page when filters change
    // Reset to first page when filters change
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", "1");
    router.push(`${pathname}?${current.toString()}`);
  };

  // Image preview handlers
  const handleOpenImagePreview = (product: ServiceProduct) => {
    setPreviewProduct(product);
    setCurrentImageIndex(0); // Start with the first image
    setShowImagePreview(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewProduct(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (previewProduct && currentImageIndex < previewProduct.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const tableData: ProductWithId[] = products.map((p) => ({ ...p, id: p._id }));

  const handleToggleActive = async (product: ServiceProduct) => {
    const productId = product._id;
    const previousStatus = product.isActive;
    const updatedStatus = !previousStatus;

    // Optimistic UI update - immediately update the UI
    setProducts((prev) =>
      prev.map((p) =>
        p._id === productId ? { ...p, isActive: updatedStatus } : p,
      ),
    );

    try {
      // Make the API call
      await updateProduct(productId, { isActive: updatedStatus });

      Toast({
        type: "success",
        message: `Product ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      // Revert the optimistic update if the API call fails
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isActive: previousStatus } : p,
        ),
      );

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
      render: (_, i) => ((currentPage - 1) * 10 + i + 1),
    },
    {
      title: "Image",
      key: "images",
      width: "80px",
      render: (item) => (
        <div
          className="h-12 w-12 sm:h-16 sm:w-16 cursor-pointer"
          onClick={() => handleOpenImagePreview(item)}
        >
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
        <div className="line-clamp-2" title={item.name}>
          {item.name}
        </div>
      ),
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
        <div className="line-clamp-2" title={item.brand}>
          {item.brand}
        </div>
      ),
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
      ),
    },
    {
      title: "Price",
      key: "price",
      width: "80px",
      align: "center",
      render: (item) => <span className="font-semibold">${item.price}</span>,
    },
    {
      title: "Popular",
      key: "popular",
      width: "60px",
      align: "center",
      render: (item) =>
        item.isPopular ? (
          <Badge
            color={"purple"}
            label={item.isPopular === true ? "Popular" : "-"}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "Stock",
      key: "stock",
      width: "60px",
      align: "center",
      render: (item) => (
        <Badge
          label={item.stock}
          color={item.stock > 2 ? "green" : item.stock > 0 ? "yellow" : "red"}
        />
      ),
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
          <Tooltip
            content="Edit Product">
            <MdModeEdit
              size={16}
              className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              onClick={() => handleEditProduct({ ...item } as ServiceProduct)}
              title="Edit product"
            />
          </Tooltip>
          <Tooltip
            content="View Product">
            <FiTrash2
              size={16}
              className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
              onClick={() => {
                setDeleteProductId(item._id);
                setShowDeleteDialog(true);
              }}
              title="Delete product"
            />
          </Tooltip>
          <Tooltip
            content={item.isActive ? "Activate" : "Deactivate"}>
            <ToggleSwitch
              checked={item.isActive}
              onChange={() => handleToggleActive({ ...item } as ServiceProduct)}
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
          Manage Products  ({totalProduct || 0})
        </h1>
        <div className="flex gap-2">
          <Button className="w-full sm:w-auto" onClick={() => router.push("/create-product")}>
            Create New Product
          </Button>
        </div>
      </div>

      {/* External Search Bar */}
      <div className="mb-4 flex justify-between items-center gap-2">
        <TextField
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set("page", "1");
            router.push(`${pathname}?${current.toString()}`);
          }}
          className="w-full sm:w-80"
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleOpenFilterPopup}
            className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <FiFilter className="mr-1" size={16} />
            Filters
          </Button>
          {areFiltersApplied() && (
            <Button
              variant="secondary"
              className="text-nowrap dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>


      {/* Filter Popup Dialog */}
      <CommonDialog
        isOpen={showFilterPopup}
        onClose={handleCloseFilterPopup}
        title="Filter Products"
        size="md"
      >
        <div className="space-y-4 dark:text-gray-200 dark:bg-gray-900 p-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <Select
              value={tempCategoryFilter}
              onChange={setTempCategoryFilter}
              options={[
                { label: "All Categories", value: "" },
                { label: "Tyre", value: "tyre" },
                { label: "Wheel", value: "wheel" },
                ...categories.filter(cat => cat !== "tyre" && cat !== "wheel").map(cat => ({
                  label: cat.charAt(0).toUpperCase() + cat.slice(1),
                  value: cat
                }))
              ]}
              placeholder="Filter by Category"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Brand
            </label>
            <Select
              value={tempBrandFilter}
              onChange={setTempBrandFilter}
              options={[
                { label: "All Brands", value: "" },
                ...brands,
              ]}
              placeholder="Filter by Brand"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select
              value={tempStatusFilter}
              onChange={setTempStatusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              placeholder="Filter by Status"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPopular"
              checked={tempIsPopularFilter === true}
              onChange={(e) => setTempIsPopularFilter(e.target.checked ? true : null)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-600"
            />
            <label
              htmlFor="isPopular"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Is Popular
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="lowStock"
              checked={tempLowStockFilter === true}
              onChange={(e) => {
                setTempLowStockFilter(e.target.checked ? true : null);
                if (e.target.checked) setTempOutOfStockFilter(null); // Uncheck "Out of Stock" if "Low Stock" is checked
              }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-600"
            />
            <label
              htmlFor="lowStock"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Low Stock (2 or less)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="outOfStock"
              checked={tempOutOfStockFilter === true}
              onChange={(e) => {
                setTempOutOfStockFilter(e.target.checked ? true : null);
                if (e.target.checked) setTempLowStockFilter(null); // Uncheck "Low Stock" if "Out of Stock" is checked
              }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-600"
            />
            <label
              htmlFor="outOfStock"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Out of Stock
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="secondary"
            onClick={handleResetFilters}
            className="w-full sm:w-auto dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Reset Filters
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
            <Button
              variant="secondary"
              onClick={handleCloseFilterPopup}
              className="w-full sm:w-auto dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="w-full sm:w-auto dark:bg-primary dark:hover:bg-indigo-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CommonDialog>

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
            <Button variant="danger" onClick={confirmDeleteProduct}>
              {loadingStates.deletingProduct ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
      </CommonDialog>

      {/* Image Preview Dialog with Carousel */}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={handleCloseImagePreview}
        size="lg"
      >
        {previewProduct && (
          <div className="flex flex-col items-center">
            <div className="relative w-full flex justify-center items-center">
              <button
                onClick={handlePrevImage}
                disabled={currentImageIndex === 0}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-lg ${currentImageIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-white dark:hover:bg-gray-600"
                  }`}
              >
                <FaAngleLeft size={18} />
              </button>

              <div className="flex justify-center items-center w-full">
                <Image
                  src={getProductImageUrl(previewProduct.images[currentImageIndex])}
                  alt={`${previewProduct.name} - Image ${currentImageIndex + 1}`}
                  width={450}
                  height={450}
                  className="rounded-lg object-contain max-h-[60vh]"
                />
              </div>

              <button
                onClick={handleNextImage}
                disabled={currentImageIndex === previewProduct.images.length - 1}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-lg ${currentImageIndex === previewProduct.images.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white dark:hover:bg-gray-600"
                  }`}
              >
                <FaAngleRight size={18} />
              </button>
            </div>

            {/* Image Counter */}
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {currentImageIndex + 1} of {previewProduct.images.length}
            </div>

            {/* Thumbnail Grid */}
            {previewProduct.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2 max-w-full overflow-x-auto py-2">
                {previewProduct.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 cursor-pointer rounded border-2 flex-shrink-0 ${currentImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : "border-gray-200 dark:border-gray-700"
                      }`}
                  >
                    <Image
                      src={getProductImageUrl(image)}
                      alt={`${previewProduct.name} - Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="h-full w-full rounded object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CommonDialog>

      <div className="overflow-x-auto">
        {loadingStates.fetchingProducts || loadingStates.deletingProduct ? (
          <Skeleton />
        ) : tableData.length === 0 && !loadingStates.fetchingProducts ? (
          <EmptyState message="No products found." />
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

export default ProductListPage;
