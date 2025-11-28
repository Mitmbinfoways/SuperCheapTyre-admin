"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById, Order } from "@/services/OrderServices";
import { Toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { IoArrowBack } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";

const OrderDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await getOrderById(id as string);
                setOrder(response.data.order);
            } catch (error: any) {
                Toast({
                    type: "error",
                    message: error?.response?.data?.message || "Failed to fetch order details",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const downloadInvoice = (orderId: string, paymentId?: string) => {
        const link = document.createElement("a");
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/order/download/${orderId}`;
        if (paymentId) {
            url += `?paymentId=${paymentId}`;
        }
        link.href = url;
        link.setAttribute("download", `invoice-${orderId}${paymentId ? `-${paymentId}` : ''}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    if (loading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Order not found</h2>
                <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    const renderProductImage = (imageUrl?: string) => {
        const fullImageUrl = imageUrl
            ? `${process.env.NEXT_PUBLIC_API_URL}/Product/${imageUrl}`
            : null;

        return fullImageUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                <Image
                    src={fullImageUrl}
                    alt="Product"
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
                                "h-full w-full bg-gray-100 flex items-center justify-center dark:bg-gray-800";
                            fallback.innerHTML =
                                '<span class="text-[10px] text-gray-500 dark:text-gray-400">No Image</span>';
                            parent.appendChild(fallback);
                        }
                    }}
                />
            </div>
        ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    No Image
                </span>
            </div>
        );
    };



    const paidAmount = order ? (Array.isArray(order.payment)
        ? order.payment.reduce((sum, p) => sum + (p.amount || 0), 0)
        : (order.payment?.amount || 0)) : 0;

    const effectiveTotal = order ? Math.max(order.subtotal, order.total) : 0;

    const isPartial = order ? paidAmount < order.total - 0.01 : false;

    const isFullPayment = order ? (
        Array.isArray(order.payment)
            ? order.payment.some(p => p.status?.toLowerCase() === 'full')
            : order.payment?.status?.toLowerCase() === 'full'
    ) : false;

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        className="p-2 rounded-full h-10 w-10 flex items-center justify-center"
                        onClick={() => router.back()}
                    >
                        <IoArrowBack size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Order Details
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {order._id}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => downloadInvoice(order._id)}
                        className="flex items-center gap-2"
                    >
                        <FiDownload size={16} />
                        <span className="hidden sm:inline">Download Invoice</span>
                    </Button>
                    {!isFullPayment && (
                        <Button
                            variant="primary"
                            onClick={() => router.push(`/admin/orders/${order._id}/edit`)}
                        >
                            Edit Invoice
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Order Items</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {order.items.map((item) => (
                                <div key={item._id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-gray-200 dark:border-gray-800 rounded-lg">
                                    {renderProductImage(item.productDetails.images?.[0])}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {item.productDetails.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            SKU: {item.productDetails.sku}
                                        </p>
                                    </div>
                                    <div className="text-right min-w-[100px]">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            AU$ {item.productDetails.price.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                            Total: AU$ {(item.productDetails.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Payment Information</h2>
                        </div>
                        <div className="p-4">
                            {Array.isArray(order.payment) ? (
                                <div className="space-y-4">
                                    {order.payment.map((payment, index) => (
                                        <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-medium text-gray-900 dark:text-white">
                                                        Payment #{index + 1}
                                                    </h5>
                                                    <Button
                                                        variant="secondary"
                                                        className="h-6 w-6 p-0 flex items-center justify-center rounded-full"
                                                        onClick={() => downloadInvoice(order._id, payment._id)}
                                                        title="Download Receipt"
                                                    >
                                                        <FiDownload size={12} />
                                                    </Button>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${payment.status === 'full' || payment.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {payment.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Method</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">{payment.method || 'Online'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Amount</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {payment.currency || 'AU$'} {payment.amount?.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-gray-500 dark:text-gray-400">Transaction ID</p>
                                                    <p className="font-medium text-gray-900 dark:text-white break-all">
                                                        {payment.transactionId || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            {payment.note && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Notes</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{payment.note}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
                                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${order.payment?.status === 'full' || order.payment?.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {order.payment?.status?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Method</p>
                                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                                            {order.payment?.method || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                                            AU$ {order.total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                                        <p className="font-medium text-gray-900 dark:text-white mt-1 break-all">
                                            {(order.payment as any)?.transactionId || '-'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Summary */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Customer Details</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="font-medium text-gray-900 dark:text-white break-all">{order.customer.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="font-medium text-gray-900 dark:text-white">{order.customer.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Details (if exists) */}
                    {order.appointment && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Appointment Details</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {order.appointment.date ? new Date(order.appointment.date).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Slot</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {order.appointment.time || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Order Summary</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">AU$ {order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Paid Amount</span>
                                <span className="font-medium text-green-600 dark:text-green-400">AU$ {paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Unpaid Amount</span>
                                <span className="font-medium text-red-600 dark:text-red-400">AU$ {(effectiveTotal - paidAmount).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                <span className="font-bold text-xl text-primary dark:text-blue-400">AU$ {effectiveTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
