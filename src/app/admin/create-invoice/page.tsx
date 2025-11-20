"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreateLocalOrder, CreateLocalOrderPayload } from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Toast } from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";

type LoadingStates = {
  fetchingProducts: boolean;
};

const CreateInvoicePage = () => {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingProducts: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(9); // 3x3 grid

  // Form state variables
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | null>(new Date());
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<string>('partial');
  const [amount, setAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const fetchProducts = useCallback(async (page: number = 1) => {
    updateLoadingState("fetchingProducts", true);
    try {
      const response = await getAllProducts({
        page: page,
        limit: pageSize,
        isActive: true,
      });
      setProducts(response.data.items);
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
  }, [pageSize]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      Toast({
        type: "error",
        message: "First name, last name, and phone are required",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      Toast({
        type: "error",
        message: "Please select at least one product",
      });
      return;
    }

    // Validate product quantities
    for (const productId of selectedProducts) {
      const product = products.find(p => p._id === productId);
      const quantity = productQuantities[productId];
      
      if (!product) {
        Toast({
          type: "error",
          message: "Product not found",
        });
        return;
      }
      
      // If quantity is not set or is invalid, treat as 1
      const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
      const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
      
      if (validQuantity < 1) {
        Toast({
          type: "error",
          message: `Quantity for ${product.name} must be at least 1`,
        });
        return;
      }
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
    let subtotal = 0;
    products
      .filter(product => selectedProducts.includes(product._id))
      .forEach(product => {
        const quantity = productQuantities[product._id];
        const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
        const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
        subtotal += product.price * validQuantity;
      });

    const total = parseFloat(amount) || subtotal;

    try {
      updateLoadingState("fetchingProducts", true);

      const payload: CreateLocalOrderPayload = {
        items,
        subtotal,
        total,
        customer: {
          name: `${firstName} ${lastName}`,
          phone,
          email,
        },
        payment: {
          amount: total,
          method: "cash",
          status: paymentStatus,
          currency: "AU$",
        },
      };

      const response = await CreateLocalOrder(payload);

      Toast({
        type: "success",
        message: "Order created successfully",
      });

      // Redirect to orders page after successful creation
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

  const handleCancel = () => {
    router.push('/admin/orders');
  };

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

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Create New Invoice
        </h1>
      </div>

      <form className="space-y-6" onSubmit={handleCreateInvoice}>
        {/* Customer Information Section */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <TextField
                type="text"
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <TextField
                type="text"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <TextField
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <TextField
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <DatePicker
                selected={orderDate}
                onChange={(date) => setOrderDate(date)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Product Selection Section */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Selection</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalProducts} products
            </span>
          </div>
          
          {loadingStates.fetchingProducts ? (
            <div className="py-4 text-center">Loading products...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className={`flex flex-col rounded-lg border p-3 ${selectedProducts.includes(product._id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <div
                      className={`flex items-start gap-3 ${product.stock > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                      onClick={() => {
                        // Prevent selection of products with zero stock
                        if (product.stock <= 0) return;
                        
                        setSelectedProducts((prev) => {
                          const newSelected = prev.includes(product._id)
                            ? prev.filter((id) => id !== product._id)
                            : [...prev, product._id];
                          
                          // Initialize or remove product quantity
                          if (!prev.includes(product._id)) {
                            // Product was just selected, initialize quantity to 1
                            setProductQuantities(prevQuantities => ({
                              ...prevQuantities,
                              [product._id]: "1"
                            }));
                          } else {
                            // Product was deselected, remove it from quantities
                            setProductQuantities(prevQuantities => {
                              const newQuantities = { ...prevQuantities };
                              delete newQuantities[product._id];
                              return newQuantities;
                            });
                          }
                          
                          return newSelected;
                        });
                      }}
                    >
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedProducts.includes(product._id) && (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Qty:</label>
                        <TextField
                          type="number"
                          value={productQuantities[product._id] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value;
                            // Allow any positive number input without restriction
                            setProductQuantities(prev => ({
                              ...prev,
                              [product._id]: value
                            }));
                          }}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Max: {product.stock}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
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
                value="Cash"
                disabled={true}
                onChange={() => { }} // Required prop, but not used for disabled fields
                className="w-full bg-gray-100 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Status
              </label>
              <Select
                value={paymentStatus}
                onChange={(value) => setPaymentStatus(value)}
                options={[
                  { label: "Partial", value: "PARTIAL" },
                  { label: "Full", value: "full" },
                ]}
                placeholder="Select payment status"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <TextField
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
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
            disabled={!firstName || !lastName || !phone || selectedProducts.length === 0}
          >
            Generate Invoice
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;