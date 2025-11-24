"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreateLocalOrder, CreateLocalOrderPayload, getAllOrders, Order } from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import { Toast } from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import CommonDialog from "@/components/ui/Dialogbox";
import { SearchIcon } from "@/components/ui/icons";
import { FiTrash2 } from "react-icons/fi";
import EditInvoice from "./Edit-invoice";

type LoadingStates = {
  fetchingProducts: boolean;
  fetchingAllProducts: boolean;
  fetchingOrders: boolean;
};

const CreateInvoicePage = () => {
  const router = useRouter();
  const hasLoadedSelectedProducts = useRef(false);

  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingProducts: false,
    fetchingAllProducts: false,
    fetchingOrders: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(9); // 3x3 grid

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Form state variables
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | null>(new Date());
  const [selectedProducts, setSelectedProducts] = useState<string[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedProducts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [productQuantities, setProductQuantities] = useState<Record<string, string>>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productQuantities');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('cash'); // New payment type state
  const [amount, setAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTabChange = (tab: 'create' | 'edit') => {
    setActiveTab(tab);
  };

  // Calculate subtotal based on selected products and quantities
  const subtotal = useMemo(() => {
    return allProducts
      .filter(product => selectedProducts.includes(product._id))
      .reduce((total, product) => {
        const quantity = productQuantities[product._id];
        const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
        const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
        return total + (product.price * validQuantity);
      }, 0);
  }, [allProducts, selectedProducts, productQuantities]);

  // Save selected products and quantities to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    }
  }, [selectedProducts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('productQuantities', JSON.stringify(productQuantities));
    }
  }, [productQuantities]);

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const fetchAllProducts = useCallback(async () => {
    updateLoadingState("fetchingAllProducts", true);
    try {
      const response = await getAllProducts({
        limit: 1000, // Fetch all products
        isActive: true,
      });

      // Merge fetched products with existing allProducts to preserve selected products
      setAllProducts(prevAllProducts => {
        // Create a map of existing products by ID for quick lookup
        const existingProductMap = new Map(prevAllProducts.map(p => [p._id, p]));

        // Add or update with fetched products
        response.data.items.forEach(product => {
          existingProductMap.set(product._id, product);
        });

        // Convert map back to array
        return Array.from(existingProductMap.values());
      });

      setFilteredProducts(response.data.items);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to fetch products",
      });
    } finally {
      updateLoadingState("fetchingAllProducts", false);
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.sku.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    if (allProducts.length === 0) {
      await fetchAllProducts();
    }
  };

  const handleSelectProduct = (product: Product) => {
    // Check if product is already selected
    if (!selectedProducts.includes(product._id)) {
      // Add product to selected products
      setSelectedProducts((prev) => [...prev, product._id]);

      // Initialize quantity to 1
      setProductQuantities((prev) => ({
        ...prev,
        [product._id]: "1"
      }));

      // Ensure the product is in allProducts array
      if (!allProducts.some(p => p._id === product._id)) {
        setAllProducts(prev => [...prev, product]);
      }

      // Clear product selection error when a product is added
      if (errors.products) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.products;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveProduct = (productId: string) => {
    // Remove product from selected products
    setSelectedProducts((prev) => prev.filter(id => id !== productId));

    // Remove product quantity
    setProductQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });

    // Clear product selection error when a product is removed
    if (errors.products) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.products;
        return newErrors;
      });
    }
  };

  const fetchProducts = useCallback(async (page: number = 1) => {
    updateLoadingState("fetchingProducts", true);
    try {
      const response = await getAllProducts({
        page: page,
        limit: pageSize,
        isActive: true,
      });

      // Merge selected products with current page products to ensure selected products are always visible
      let mergedProducts = [...response.data.items];

      // Add any selected products that aren't in the current page
      if (selectedProducts.length > 0) {
        const currentPageProductIds = response.data.items.map((p: Product) => p._id);
        const missingSelectedProducts = selectedProducts.filter(
          id => !currentPageProductIds.includes(id)
        );

        // Find missing selected products in allProducts and add them
        const productsToAdd = allProducts.filter(p =>
          missingSelectedProducts.includes(p._id) &&
          !currentPageProductIds.includes(p._id)
        );

        mergedProducts = [...response.data.items, ...productsToAdd];
      }

      setProducts(mergedProducts);
      setTotalPages(response.data.pagination.totalPages);
      setTotalProducts(response.data.pagination.totalItems);
      setCurrentPage(page);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to fetch products",
      });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  }, [pageSize, selectedProducts, allProducts]);

  useEffect(() => {
    fetchProducts(currentPage);

    // If there are selected products in localStorage, ensure their details are loaded
    if (!hasLoadedSelectedProducts.current) {
      const savedSelectedProducts = localStorage.getItem('selectedProducts');
      if (savedSelectedProducts) {
        const selectedIds = JSON.parse(savedSelectedProducts);
        if (Array.isArray(selectedIds) && selectedIds.length > 0) {
          // Check if we have all selected products in allProducts
          const missingProducts = selectedIds.filter(id =>
            !allProducts.some(product => product._id === id)
          );

          // If there are missing products, fetch all products to ensure we have them
          if (missingProducts.length > 0) {
            fetchAllProducts();
          }
        }
      }
      hasLoadedSelectedProducts.current = true;
    }

    // Reset the ref when component unmounts
    return () => {
      hasLoadedSelectedProducts.current = false;
    };
  }, [fetchProducts, currentPage, allProducts, fetchAllProducts]);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (selectedProducts.length === 0) {
      newErrors.products = "Please select at least one product";
    }

    // Validate product quantities
    for (const productId of selectedProducts) {
      const product = allProducts.find(p => p._id === productId);
      const quantity = productQuantities[productId];

      if (!product) {
        newErrors.products = "Product not found";
        break;
      }

      // If quantity is not set or is invalid, treat as 1
      const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
      const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;

      if (validQuantity < 1) {
        newErrors.products = `Quantity for ${product.name} must be at least 1`;
        break;
      }

      if (validQuantity > product.stock) {
        newErrors.products = `Quantity for ${product.name} exceeds available stock`;
        break;
      }
    }

    // Validate payment details
    if (!paymentStatus) {
      newErrors.paymentStatus = "Payment status is required";
    }

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 0) {
        newErrors.amount = "Please enter a valid amount";
      } else if (amountValue > subtotal) {
        newErrors.amount = "Amount cannot exceed subtotal";
      }
    }

    // Set errors if any
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare items with quantities
    const items = selectedProducts.map(productId => {
      const quantity = productQuantities[productId];
      const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
      const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
      return {
        id: productId,
        quantity: validQuantity
      };
    });

    // Calculate subtotal and total
    const total = parseFloat(amount);

    try {
      updateLoadingState("fetchingProducts", true);

      const payload: CreateLocalOrderPayload = {
        items,
        subtotal,
        total,
        customer: {
          firstName,
          lastName,
          phone,
          email,
        },
        payment: {
          amount: total,
          method: paymentType,
          status: paymentStatus,
          note: paymentNotes,
          currency: "AU$",
        },
      };

      const response = await CreateLocalOrder(payload);

      Toast({
        type: "success",
        message: "Order created successfully",
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('productQuantities');
      }
      setSelectedProducts([]);
      setProductQuantities({});

      router.push('/admin/orders');
    } catch (error: any) {
      console.error("Error creating order:", error);
      Toast({
        type: "error",
        message: error?.response?.data?.errorData || "Failed to create order",
      });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedProducts');
      localStorage.removeItem('productQuantities');
    }
    router.push('/admin/orders');
  };

  // Add a function to manually clear saved data
  const clearSavedSelection = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedProducts');
      localStorage.removeItem('productQuantities');
    }
    setSelectedProducts([]);
    setProductQuantities({});
  };

  // We'll add a button or other UI element to clear selections if needed
  // For now, we'll keep the data in localStorage until the order is created or user explicitly cancels

  const renderProductImage = (product: Product) => {
    const imageUrl = product.images?.[0]
      ? `${process.env.NEXT_PUBLIC_API_URL}/Product/${product.images[0]}`
      : null;

    return imageUrl ? (
      <div className="h-16 w-16 overflow-hidden rounded">
        <Image
          src={imageUrl}
          alt={product.name}
          width={64}
          height={64}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement("div");
              fallback.className =
                "h-full w-full bg-gray-200 flex items-center justify-center dark:bg-gray-700";
              fallback.innerHTML =
                '<span class="text-xs text-gray-500 dark:text-gray-400">No Image</span>';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    ) : (
      <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          No Image
        </span>
      </div>
    );
  };

  // Add a function to handle key down events in form fields
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Add a ref to the form to handle Enter key prevention
  const formRef = useRef<HTMLFormElement>(null);

  // Handle form level key down to prevent Enter submission
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Invoices
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('create')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'create'
              ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => handleTabChange('edit')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'edit'
              ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Edit Invoice
          </button>
        </nav>
      </div>

      {/* Create Invoice Tab Content */}
      {activeTab === 'create' && (
        <form 
          ref={formRef} 
          className="space-y-6" 
          onSubmit={handleCreateInvoice}
          onKeyDown={handleFormKeyDown}
        >
          {/* Customer Information Section */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name <span className="text-red-500">*</span>
                </label>
                <TextField
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    // Clear error when user starts typing
                    if (errors.firstName) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.firstName;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full ${errors.firstName ? 'border-red-500' : ''}`}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <TextField
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    // Clear error when user starts typing
                    if (errors.lastName) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.lastName;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full ${errors.lastName ? 'border-red-500' : ''}`}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <TextField
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (errors.email) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <TextField
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => {
                    // Allow only numeric input and limit to 15 digits
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
                    setPhone(value);
                    // Clear error when user starts typing
                    if (errors.phone) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.phone;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <DatePicker
                  value={orderDate}
                  onChange={(date) => setOrderDate(date)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Product Selection
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleOpenModal}
                  className="text-sm w-full sm:w-auto"
                  type="button"
                >
                  Add Products
                </Button>

                {selectedProducts.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={clearSavedSelection}
                    className="text-sm w-full sm:w-auto"
                  >
                    Clear Selection
                  </Button>
                )}

                <span className="text-sm text-gray-500 dark:text-gray-400 sm:ml-2">
                  {selectedProducts.length} selected
                </span>
              </div>
            </div>

            {errors.products && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-500 text-sm">{errors.products}</p>
              </div>
            )}

            {selectedProducts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No products selected. Click Add Products to select items.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {allProducts
                  .filter(product => selectedProducts.includes(product._id))
                  .map((product) => {
                    const quantity = productQuantities[product._id] || "1";
                    const numericQuantity = parseInt(quantity, 10) || 1;

                    return (
                      <div
                        key={product._id}
                        className="flex flex-col rounded-lg border border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20"
                      >
                        <div className="flex items-start gap-3">
                          {renderProductImage(product)}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              SKU: {product.sku}
                            </p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                AU$ {product.price.toFixed(2)}
                              </span>
                              <span className={`text-xs ${product.stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}>
                                Stock: {product.stock}
                              </span>
                            </div>
                          </div>
                        </div>

                        {product.stock <= 0 ? (
                          <div className="mt-2">
                            <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Out of Stock
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                onClick={() => {
                                  const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                  const newQuantity = Math.max(1, currentQuantity - 1);
                                  setProductQuantities(prev => ({
                                    ...prev,
                                    [product._id]: newQuantity.toString()
                                  }));
                                }}
                                disabled={parseInt(productQuantities[product._id] || "1", 10) <= 1}
                              >
                                <span className="text-lg">-</span>
                              </button>
                              <div className="flex h-8 w-12 items-center justify-center border-y border-gray-300 bg-white text-sm dark:border-gray-600 dark:bg-gray-800">
                                {productQuantities[product._id] || "1"}
                              </div>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-r border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                onClick={() => {
                                  const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                  const newQuantity = Math.min(product.stock, currentQuantity + 1);
                                  setProductQuantities(prev => ({
                                    ...prev,
                                    [product._id]: newQuantity.toString()
                                  }));
                                }}
                                disabled={parseInt(productQuantities[product._id] || "1", 10) >= product.stock}
                              >
                                <span className="text-lg">+</span>
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Max: {product.stock}</span>
                          </div>
                        )}

                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="danger"
                            onClick={() => handleRemoveProduct(product._id)}
                            className="text-xs"
                          >
                            <FiTrash2
                              size={16}
                              title="Delete product"
                            />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <TextField
                  type="text"
                  value="Offline"
                  disabled={true}
                  className="w-full bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Type
                </label>
                <Select
                  value={paymentType}
                  onChange={(value) => setPaymentType(value)}
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Credit Card/Debit Card", value: "creditcard" },
                    { label: "EFTPOS", value: "etfpos" },
                    { label: "Afterpay", value: "afterpay" },
                    { label: "Other", value: "other" },
                  ]}
                  placeholder="Select payment method"
                  className="w-full"
                />
              </div>
              <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={paymentStatus}
                    onChange={(value) => {
                      setPaymentStatus(value);
                      if (errors.paymentStatus) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.paymentStatus;
                          return newErrors;
                        });
                      }
                    }}
                    options={[
                      { label: "Partial", value: "PARTIAL" },
                      { label: "Full", value: "full" },
                    ]}
                    placeholder="Select payment status"
                    className="w-full"
                  />
                  {errors.paymentStatus && <p className="text-red-500 text-sm mt-1">{errors.paymentStatus}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subtotal
                  </label>
                  <TextField
                    type="text"
                    value={`AU$ ${subtotal.toFixed(2)}`}
                    disabled={true}
                    className="w-full bg-gray-100 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <TextField
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.amount;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full ${errors.amount ? 'border-red-500' : ''}`}
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter payment notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
              Create Invoice
            </Button>
          </div>
        </form>
      )}
      {activeTab === 'edit' && (
        <>
          <EditInvoice onBack={() => router.push('/admin/orders')} />
        </>
      )}
      <CommonDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Products"
        size="xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <TextField
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          {loadingStates.fetchingAllProducts ? (
            <div className="py-4 text-center">Loading products...</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${selectedProducts.includes(product._id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    {renderProductImage(product)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        SKU: {product.sku}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          AU$ {product.price.toFixed(2)}
                        </span>
                        <span className={`text-xs ${product.stock > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {product.stock <= 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Out of Stock
                          </span>
                        </div>
                      ) : selectedProducts.includes(product._id) ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-l border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                              onClick={() => {
                                const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                const newQuantity = Math.max(1, currentQuantity - 1);
                                setProductQuantities(prev => ({
                                  ...prev,
                                  [product._id]: newQuantity.toString()
                                }));
                              }}
                              disabled={parseInt(productQuantities[product._id] || "1", 10) <= 1}
                            >
                              <span className="text-sm">-</span>
                            </button>
                            <div className="flex h-6 w-8 items-center justify-center border-y border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-800">
                              {productQuantities[product._id] || "1"}
                            </div>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-r border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                              onClick={() => {
                                const currentQuantity = parseInt(productQuantities[product._id] || "1", 10);
                                const newQuantity = Math.min(product.stock, currentQuantity + 1);
                                setProductQuantities(prev => ({
                                  ...prev,
                                  [product._id]: newQuantity.toString()
                                }));
                              }}
                              disabled={parseInt(productQuantities[product._id] || "1", 10) >= product.stock}
                            >
                              <span className="text-sm">+</span>
                            </button>
                          </div>
                          <Button
                            variant="danger"
                            onClick={() => handleRemoveProduct(product._id)}
                            className="text-xs p-2"
                          >
                            <FiTrash2
                              size={16}
                              title="Delete product"
                            />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => handleSelectProduct(product)}
                          className="text-xs"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No products found matching your search.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CommonDialog>
    </div>
  );
};

export default CreateInvoicePage;