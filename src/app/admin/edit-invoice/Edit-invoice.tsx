"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAllOrders, Order, updateOrder, getOrderById } from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Toast } from "@/components/ui/Toast";
import { FiPlus } from "react-icons/fi";

type LoadingStates = {
    fetchingOrders: boolean;
    fetchingProducts: boolean;
};

interface EditInvoiceProps {
    onBack: () => void;
    initialOrderId?: string | null;
    disableOrderSelect?: boolean;
}

// Define payment interface
interface PaymentDetail {
    id: string;
    method: string;
    status: string;
    amount: string;
    note: string;
}

const EditInvoice: React.FC<EditInvoiceProps> = ({ onBack, initialOrderId, disableOrderSelect = false }) => {
    const router = useRouter();

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [previousPayments, setPreviousPayments] = useState<any[]>([]);

    // Products state
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        fetchingOrders: false,
        fetchingProducts: false,
    });
    // Form state variables
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [orderDate, setOrderDate] = useState<Date | null>(new Date());
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [productQuantities, setProductQuantities] = useState<Record<string, string>>({});

    // Payment details state (multiple payments)
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([
        { id: Date.now().toString(), method: 'cash', status: 'full', amount: '', note: '' }
    ]);

    // Validation error state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch orders for the dropdown
    const fetchOrders = useCallback(async () => {
        if (disableOrderSelect) return;

        setLoadingStates(prev => ({ ...prev, fetchingOrders: true }));
        try {
            const response = await getAllOrders({
                limit: 100,
                status: "PARTIAL",
            });

            const filteredOrders = response.data.orders.filter((order: any) => {
                const payments = Array.isArray(order.payment) ? order.payment : order.payment ? [order.payment] : [];
                return !payments.some((payment: any) =>
                    payment?.status?.toLowerCase() === "full" ||
                    payment?.paymentStatus?.toLowerCase() === "full"
                );
            });

            setOrders(filteredOrders);
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to fetch orders",
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchingOrders: false }));
        }
    }, [disableOrderSelect]);

    // Fetch all products
    const fetchAllProducts = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, fetchingProducts: true }));
        try {
            const response = await getAllProducts({
                isActive: true,
            });
            setAllProducts(response.data.items);
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to fetch products",
            });
        } finally {
            setLoadingStates(prev => ({ ...prev, fetchingProducts: false }));
        }
    }, []);

    // Fetch order details when selected for editing
    const fetchOrderDetails = useCallback(async (orderId: string) => {
        if (!orderId) return;

        try {
            let order = orders.find(o => o._id === orderId);

            // If order not found in the list (e.g. passed via props but not in partial list), fetch it directly
            if (!order) {
                try {
                    const response = await getOrderById(orderId);
                    order = response.data.order;
                } catch (err) {
                    console.error("Failed to fetch specific order", err);
                }
            }

            if (order) {
                setSelectedOrder(order);
                // Populate form fields with order data
                setFirstName(order.customer.name.split(' ')[0] || '');
                setLastName(order.customer.name.split(' ').slice(1).join(' ') || '');
                setEmail(order.customer.email || '');
                setPhone(order.customer.phone);

                // Extract date from order (assuming createdAt is available)
                if (order.createdAt) {
                    setOrderDate(new Date(order.createdAt));
                }

                // Store previous payments
                const payments = Array.isArray(order.payment) ? order.payment : order.payment ? [order.payment] : [];
                setPreviousPayments(payments);

                // Populate products
                const orderProductIds = order.items.map(item => item.id);
                const orderProductQuantities: Record<string, string> = {};
                order.items.forEach(item => {
                    orderProductQuantities[item.id] = item.quantity?.toString();
                });
                setSelectedProducts(orderProductIds);
                setProductQuantities(orderProductQuantities);
                setPaymentDetails([
                    {
                        id: Date.now().toString(),
                        method: order.payment && !Array.isArray(order.payment) ? order.payment.method : 'cash',
                        status: 'full', // Default to full for new payment
                        amount: '',
                        note: ''
                    }
                ]);
            }
        } catch (e: any) {
            Toast({
                type: "error",
                message: e?.response?.data?.errorData || "Failed to fetch order details",
            });
        }
    }, [orders]);

    // Handle order selection for editing
    const handleOrderSelect = (orderId: string) => {
        setSelectedOrderId(orderId);
        fetchOrderDetails(orderId);
    };

    // Effect to handle initialOrderId
    useEffect(() => {
        if (initialOrderId) {
            setSelectedOrderId(initialOrderId);
            fetchOrderDetails(initialOrderId);
        }
    }, [initialOrderId, fetchOrderDetails]);

    // Calculate subtotal based on selected products and quantities
    const subtotal = useCallback(() => {
        return allProducts
            .filter(product => selectedProducts.includes(product._id))
            .reduce((total, product) => {
                const quantity = productQuantities[product._id];
                const numericQuantity = quantity ? parseInt(quantity, 10) : NaN;
                const validQuantity = (isNaN(numericQuantity) || numericQuantity < 1) ? 1 : numericQuantity;
                return total + (product.price * validQuantity);
            }, 0);
    }, [allProducts, selectedProducts, productQuantities]);

    // Calculate remaining balance
    const calculateRemainingBalance = useCallback(() => {
        const subTotal = subtotal();
        const previousPaymentsTotal = previousPayments.reduce((total, payment) => {
            const amount = parseFloat(payment.amount) || 0;
            return total + amount;
        }, 0);

        const currentPaymentsTotal = paymentDetails.reduce((total, payment) => {
            // Only include payments with valid amounts in the total
            const amount = parseFloat(payment.amount) || 0;
            return total + amount;
        }, 0);

        return subTotal - previousPaymentsTotal - currentPaymentsTotal;
    }, [subtotal, previousPayments, paymentDetails]);

    // Payment details handlers
    const addPaymentDetail = () => {
        setPaymentDetails(prev => [
            ...prev,
            { id: Date.now().toString(), method: 'cash', status: 'full', amount: '', note: '' }
        ]);
    };

    const removePaymentDetail = (id: string) => {
        if (paymentDetails.length > 1) {
            setPaymentDetails(prev => prev.filter(payment => payment.id !== id));
        } else {
            // If it's the last payment detail, just reset its values
            setPaymentDetails([{ id: Date.now().toString(), method: 'cash', status: 'full', amount: '', note: '' }]);
        }
    };

    const updatePaymentDetail = (id: string, field: keyof PaymentDetail, value: string) => {
        setPaymentDetails(prev =>
            prev.map(payment => {
                // If status is changed to "full", auto-populate amount with remaining balance
                if (field === 'status' && value === 'full') {
                    const remainingBalance = calculateRemainingBalance();
                    // Add back the current payment's amount to the balance calculation
                    const currentPayment = prev.find(p => p.id === id);
                    const currentAmount = currentPayment?.amount ? parseFloat(currentPayment.amount) || 0 : 0;
                    const adjustedBalance = remainingBalance + currentAmount;

                    return payment.id === id ? { ...payment, [field]: value, amount: adjustedBalance.toFixed(2) } : payment;
                }
                return payment.id === id ? { ...payment, [field]: value } : payment;
            })
        );
    };

    useEffect(() => {
        fetchOrders();
        fetchAllProducts();
    }, [fetchOrders, fetchAllProducts]);

    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        setErrors({});

        // Validate required fields
        const newErrors: Record<string, string> = {};

        if (!firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!phone.trim()) {
            newErrors.phone = "Phone number is required";
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
        let totalPaymentAmount = 0;
        for (let i = 0; i < paymentDetails.length; i++) {
            const payment = paymentDetails[i];

            if (!payment.status) {
                newErrors[`paymentStatus${i}`] = `Payment status is required for payment `;
            }

            if (!payment.amount) {
                newErrors[`paymentAmount${i}`] = `Amount is required for payment #${i + 1}`;
            } else {
                const amountValue = parseFloat(payment.amount);
                if (isNaN(amountValue) || amountValue < 0) {
                    newErrors[`paymentAmount${i}`] = `Please enter a valid amount for payment #${i + 1}`;
                } else {
                    totalPaymentAmount += amountValue;
                }
            }
        }

        // Check if total payment amount exceeds subtotal
        if (totalPaymentAmount > subtotal()) {
            newErrors.paymentTotal = "Total payment amount cannot exceed subtotal";
        }

        // Set errors if any
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Implement update order functionality
        try {
            if (!selectedOrderId) {
                Toast({
                    type: "error",
                    message: "No order selected for update",
                });
                return;
            }
            const primaryPayment = paymentDetails[0];

            const updatePayload = {
                method: primaryPayment.method,
                amount: parseFloat(primaryPayment.amount),
                status: primaryPayment.status,
                note: primaryPayment.note,
            };

            const response = await updateOrder(selectedOrderId, updatePayload);

            if (response.statusCode === 200) {
                Toast({
                    type: "success",
                    message: "Invoice updated successfully",
                });
                // Optionally refresh the orders list or reset the form
                onBack();
            } else {
                Toast({
                    type: "error",
                    message: response.message || "Failed to update invoice",
                });
            }
        } catch (error: any) {
            console.error("Error updating invoice:", error);
            Toast({
                type: "error",
                message: error?.response?.data?.message || "Failed to update invoice",
            });
        }
    };

    const handleCancel = () => {
        onBack();
    };

    const renderProductImage = (product: any) => {
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
                    Edit Invoice
                </h1>
            </div>

            <div className="space-y-6">
                {!disableOrderSelect && (
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Select Order to Edit</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Select Order
                                </label>
                                <Select
                                    value={selectedOrderId}
                                    onChange={(value) => handleOrderSelect(value)}
                                    options={orders.map(order => ({
                                        label: `Order #${order._id.substring(0, 8)} - ${order.customer.name} - ${order.customer.phone} (${new Date(order.createdAt).toLocaleDateString()})`,
                                        value: order._id
                                    }))}
                                    placeholder="Select an order to edit"
                                    className="w-full"
                                    disabled={loadingStates.fetchingOrders}
                                />
                                {loadingStates.fetchingOrders && (
                                    <p className="text-sm text-gray-500 mt-1">Loading orders...</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {selectedOrder && (
                    <form className="space-y-6" onSubmit={handleUpdateInvoice}>
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
                                        disabled={true}
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
                                        Last Name
                                    </label>
                                    <TextField
                                        type="text"
                                        placeholder="Enter last name"
                                        value={lastName}
                                        disabled={true}
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
                                        Email
                                    </label>
                                    <TextField
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        disabled={true}
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
                                        Phone
                                    </label>
                                    <TextField
                                        type="tel"
                                        placeholder="Enter phone number"
                                        value={phone}
                                        disabled={true}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
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
                                        selected={orderDate}
                                        disabled={true}
                                        onChange={(date) => setOrderDate(date)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product Selection Section */}
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Selected Products</h3>
                            </div>

                            {selectedProducts.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No products selected for this order.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    {selectedOrder.items.map((item) => {
                                        // Create a Product-like object from the OrderItem data
                                        const product = {
                                            name: item.productDetails?.name,
                                            images: item.productDetails?.images,
                                            sku: item.productDetails?.sku,
                                            price: item.productDetails?.price,
                                        };

                                        const quantity = item.quantity?.toString() || "1";

                                        return (
                                            <div
                                                key={item._id}
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
                                                                AU$ {product.price?.toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                Qty: {quantity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Payment Details Section */}
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Details</h3>
                                <Button
                                    variant="primary"
                                    onClick={addPaymentDetail}
                                    className="text-sm flex items-center gap-1"
                                    type="button"
                                >
                                    <FiPlus size={16} />
                                    Add Payment
                                </Button>
                            </div>

                            {errors.paymentTotal && (
                                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-red-500 text-sm">{errors.paymentTotal}</p>
                                </div>
                            )}

                            <div className="space-y-6">

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                                            <p className="font-medium">AU$ {subtotal().toFixed(2)}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Previous Payments</p>
                                            <p className="font-medium">
                                                AU$ {previousPayments.reduce((total, payment) => {
                                                    const amount = parseFloat(payment.amount) || 0;
                                                    return total + amount;
                                                }, 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining Balance</p>
                                            <p className="font-medium">
                                                AU$ {(subtotal() - previousPayments.reduce((total, payment) => {
                                                    const amount = parseFloat(payment.amount) || 0;
                                                    return total + amount;
                                                }, 0) - paymentDetails.reduce((total, payment) => {
                                                    const amount = parseFloat(payment.amount) || 0;
                                                    return total + amount;
                                                }, 0)).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {previousPayments.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Previous Payments</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                                            {previousPayments.map((payment, index) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {payment.method || 'Online'}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium">
                                                        AU$ {parseFloat(payment.amount || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">Total Previous Payments:</span>
                                            <span className="font-bold text-lg">
                                                AU$ {previousPayments.reduce((total, payment) => {
                                                    const amount = parseFloat(payment.amount) || 0;
                                                    return total + amount;
                                                }, 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {paymentDetails.map((payment, index) => (
                                    <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                Payment #{index + 1}
                                            </h4>
                                            {paymentDetails.length > 1 && (
                                                <Button
                                                    variant="danger"
                                                    onClick={() => removePaymentDetail(payment.id)}
                                                    className="text-xs"
                                                    type="button"
                                                >
                                                    <span className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Payment Method <span className="text-red-500">*</span>
                                                </label>
                                                <Select
                                                    value={payment.method}
                                                    onChange={(value) => updatePaymentDetail(payment.id, 'method', value)}
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
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Payment Status <span className="text-red-500">*</span>
                                                </label>
                                                <Select
                                                    value={payment.status}
                                                    onChange={(value) => {
                                                        updatePaymentDetail(payment.id, 'status', value);
                                                        // Clear error when user selects an option
                                                        if (errors[`paymentStatus${index}`]) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors[`paymentStatus${index}`];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    options={[
                                                        { label: "Partial", value: "partial" },
                                                        { label: "Full", value: "full" },
                                                    ]}
                                                    placeholder="Select payment status"
                                                    className="w-full"
                                                />
                                                {errors[`paymentStatus${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`paymentStatus${index}`]}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Amount <span className="text-red-500">*</span>
                                                </label>
                                                <TextField
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    value={payment.amount}
                                                    onChange={(e) => {
                                                        const enteredAmount = e.target.value;
                                                        updatePaymentDetail(payment.id, 'amount', enteredAmount);

                                                        // Validate amount doesn't exceed remaining balance
                                                        const amountValue = parseFloat(enteredAmount);
                                                        if (!isNaN(amountValue) && amountValue > 0) {
                                                            const remainingBalance = calculateRemainingBalance();
                                                            // Add back the current payment's amount to the balance calculation
                                                            const currentAmount = payment.amount ? parseFloat(payment.amount) || 0 : 0;
                                                            const adjustedBalance = remainingBalance + currentAmount;

                                                            if (amountValue > adjustedBalance) {
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    [`paymentAmount${index}`]: `Payment amount cannot exceed remaining balance of $${adjustedBalance.toFixed(2)}`
                                                                }));
                                                            } else if (errors[`paymentAmount${index}`]?.includes("Payment amount cannot exceed")) {
                                                                // Clear the specific error if amount is now valid
                                                                setErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors[`paymentAmount${index}`];
                                                                    return newErrors;
                                                                });
                                                            }
                                                        }

                                                        // Clear general error when user starts typing
                                                        if (errors[`paymentAmount${index}`] && !errors[`paymentAmount${index}`]?.includes("Payment amount cannot exceed")) {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors[`paymentAmount${index}`];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    className={`w-full ${errors[`paymentAmount${index}`] ? 'border-red-500' : ''}`}
                                                />
                                                {errors[`paymentAmount${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`paymentAmount${index}`]}</p>}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Notes
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Enter payment notes"
                                                    value={payment.note}
                                                    onChange={(e) => updatePaymentDetail(payment.id, 'note', e.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <Button variant="secondary" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                    >
                                        Update Invoice
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditInvoice;