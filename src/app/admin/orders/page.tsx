"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllOrders, Order, OrderItem } from "@/services/OrderServices";
import { getAllProducts, Product } from "@/services/CreateProductService";
import Pagination from "@/components/ui/Pagination";
import Image from "next/image";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/EmptyState";
import { FiDownload } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import "react-datepicker/dist/react-datepicker.css";

type LoadingStates = {
  fetchingOrders: boolean;
  fetchingProducts: boolean;
};

const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [dateFilter, setDateFilter] = useState<string>("All Time");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingOrders: false,
    fetchingProducts: false,
  });

  // Filter orders based on search, format, and date filters
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.customer.name && order.customer.name.toLowerCase().includes(searchLower)) ||
        (order.customer.email && order.customer.email.toLowerCase().includes(searchLower)) ||
        (order.customer.phone && order.customer.phone.includes(searchLower))
      );
    }

    // Apply format/payment status filter
    if (formatFilter !== "All") {
      filtered = filtered.filter(order => {
        // Helper to resolve status safely
        const getPaymentStatus = (): string => {
          const payment = order?.payment;
          if (!payment) return "";
          if (Array.isArray(payment)) {
            if (payment.length === 0) return "";
            const hasFullPayment = payment.some(
              (p) => p?.status?.toUpperCase() === "FULL"
            );
            return hasFullPayment ? "FULL" : "PARTIAL";
          }
          if (payment && typeof payment === "object") {
            return payment.status?.toUpperCase() || "";
          }
          return "";
        };

        const status = getPaymentStatus();
        return status === formatFilter.toUpperCase();
      });
    }

    // Apply date filter
    if (dateFilter !== "All Time") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;

        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "Today":
            return orderDate.getTime() === today.getTime();
          case "Yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return orderDate.getTime() === yesterday.getTime();
          case "This Week":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Sunday
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Saturday
            return orderDate >= weekStart && orderDate <= weekEnd;
          case "This Month":
            return orderDate.getMonth() === today.getMonth() &&
              orderDate.getFullYear() === today.getFullYear();
          case "Custom Range":
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              return orderDate >= startDate && orderDate <= endDate;
            }
            return true; // If no custom dates selected, show all
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [orders, debouncedSearchTerm, formatFilter, dateFilter, customStartDate, customEndDate]);

  // Paginate filtered orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Update total pages based on filtered orders
  const filteredTotalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / pageSize);
  }, [filteredOrders.length, pageSize]);

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const fetchProducts = useCallback(async () => {
    updateLoadingState("fetchingProducts", true);
    try {
      const response = await getAllProducts({
        page: 1,
        limit: 100, // Fetch a reasonable number of products
        isActive: true,
      });
      setProducts(response.data.items);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to fetch products",
      });
    } finally {
      updateLoadingState("fetchingProducts", false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    updateLoadingState("fetchingOrders", true);
    try {
      const isFiltering = debouncedSearchTerm || formatFilter !== "All" || dateFilter !== "All Time";

      const response = await getAllOrders({
        page: isFiltering ? 1 : currentPage,
        limit: isFiltering ? 1000 : pageSize,
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
      setTotalOrders(response.data.pagination.totalItems);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to fetch orders",
      });
    } finally {
      updateLoadingState("fetchingOrders", false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, formatFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, formatFilter, dateFilter, customStartDate, customEndDate]);

  const getTotalItems = (items: OrderItem[]) =>
    items.reduce((total, item) => total + item.quantity, 0);

  const toggleExpandedOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const renderProductImage = (item: OrderItem) => {
    const imageUrl = item.productDetails.images?.[0]
      ? `${process.env.NEXT_PUBLIC_API_URL}/Product/${item.productDetails.images[0]}`
      : null;

    return imageUrl ? (
      <div className="h-12 w-12 overflow-hidden rounded">
        <Image
          src={imageUrl}
          alt={item.productDetails.name}
          width={48}
          height={48}
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
      <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          No Image
        </span>
      </div>
    );
  };

  const renderProductDetails = (items: OrderItem[], orderId: string, order: Order) => {
    const isExpanded = expandedOrderId === orderId;

    return (
      <tr>
        <td colSpan={9} className="p-0">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="bg-gray-50 p-4 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-200">
                Product Details
              </h3>

              {/* Payment Information Section */}
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-700">
                <h4 className="mb-3 text-md font-semibold text-gray-900 dark:text-gray-100">
                  Payment Information
                </h4>

                {Array.isArray(order.payment) ? (
                  <div className="space-y-4">
                    {order.payment.map((payment, index) => (
                      <div key={index} className="rounded-md border border-gray-300 p-3 dark:border-gray-600">
                        <h5 className="mb-2 font-medium text-gray-800 dark:text-gray-200">
                          Payment #{index + 1}
                        </h5>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Method</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payment?.method || 'Online'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payment?.status.toLowerCase() || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Amount</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payment?.currency || 'AU$'} {payment?.amount?.toFixed(2) || '-'}
                            </p>
                          </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Transaction ID</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {payment?.transactionId || "-"}
                              </p>
                            </div>
                          {payment?.note && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Notes</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100 max-h-28 overflow-y-auto">
                                {payment?.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : order.payment ? (
                  // Handle single payment object
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {order.payment?.method || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Payment Status</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {order.payment?.status.toLowerCase() || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Amount</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        AU$ {order.total.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Currency</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {order.payment?.currency || 'AU$'}
                      </p>
                    </div>
                    {(order.payment as any)?.transactionId && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Transaction ID</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {order.payment?.transactionId}
                        </p>
                      </div>
                    )}
                    {order.payment?.paidAt && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Payment Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {order.payment?.paidAt ? new Date(order.payment?.paidAt).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Handle no payment
                  <p className="text-gray-600 dark:text-gray-300">No payment information available</p>
                )}

                {order.payment && !Array.isArray(order.payment) && order.payment?.note && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Notes</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {order.payment?.note}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 rounded-lg border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-700"
                  >
                    {renderProductImage(item)}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.productDetails.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        SKU: {item.productDetails.sku}
                      </p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Qty: {item.quantity}</span>
                        <span>AU$ {item.productDetails.price.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 text-right font-medium text-gray-800 dark:text-gray-100">
                        Total: AU${" "}
                        {(item.productDetails.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const downloadInvoice = (orderId: string) => {
    const link = document.createElement("a");
    link.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/order/download/${orderId}`;
    link.setAttribute("download", `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const columns = [
    {
      title: "Sr.No",
      key: "index",
      width: "80px",
      render: (_: Order, i: number) => (
        <div className="flex items-center">
          {(currentPage - 1) * pageSize + i + 1}
          <span className="ml-2 transition-transform duration-300">
            {expandedOrderId === displayOrders[i]?._id ? (
              <IoIosArrowUp className="text-gray-500 dark:text-gray-400" />
            ) : (
              <IoIosArrowDown className="text-gray-500 dark:text-gray-400" />
            )}
          </span>
        </div>
      ),
    },
    {
      title: "Customer Name",
      key: "customer.name",
      render: (order: Order) => order.customer.name,
    },
    {
      title: "Email",
      key: "customer.email",
      render: (order: Order) => (
        <span className="block max-w-[180px] truncate sm:max-w-none">
          {order.customer.email}
        </span>
      ),
    },
    {
      title: "Phone",
      key: "customer.phone",
      render: (order: Order) => order.customer.phone,
    },
    {
      title: "Order Date",
      key: "date",
      render: (order: Order) =>
        order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-",
    },
    {
      title: "Product Count",
      key: "itemsCount",
      width: "50px",
      render: (order: Order) => (
        <div className="text-center">{getTotalItems(order.items)}</div>
      ),
    },
    {
      title: "Payment Status",
      key: "total",
      render: (order: Order) => {
        // Helper to resolve status safely
        const getPaymentStatus = (): string => {
          const payment = order?.payment;
          if (!payment) return "-";
          if (Array.isArray(payment)) {
            if (payment.length === 0) return "-";
            const hasFullPayment = payment.some(
              (p) => p?.status?.toUpperCase() === "FULL"
            );
            return hasFullPayment ? "FULL" : "PARTIAL";
          }
          if (payment && typeof payment === "object") {
            return payment.status?.toUpperCase() || "-";
          }

          return "-";
        };

        const status = getPaymentStatus();
        const color = status === "PARTIAL" ? "yellow" : "green";

        return <Badge color={color} label={status} />;
      },
    },
    {
      title: "Total (AU$)",
      key: "total",
      render: (order: Order) => `AU$${order.total.toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (order: Order) => (
        <div className="flex items-center justify-center space-x-2">
          <Tooltip content="Download Invoice">
            <FiDownload
              size={18}
              className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title="Download"
              onClick={(e) => {
                e.stopPropagation();
                downloadInvoice(order._id);
              }}
            />
          </Tooltip>
        </div>
      ),
    },

  ];

  // Determine which orders to display based on filtering
  const displayOrders = useMemo(() => {
    // If we're filtering, use the filtered and paginated orders
    // If we're not filtering, use the raw orders from backend pagination
    const isFiltering = debouncedSearchTerm || formatFilter !== "All" || dateFilter !== "All Time";

    if (isFiltering) {
      return paginatedOrders;
    } else {
      return orders;
    }
  }, [orders, paginatedOrders, debouncedSearchTerm, formatFilter, dateFilter]);

  // Determine total pages to display
  const displayTotalPages = useMemo(() => {
    const isFiltering = debouncedSearchTerm || formatFilter !== "All" || dateFilter !== "All Time";

    if (isFiltering) {
      return filteredTotalPages;
    } else {
      return totalPages;
    }
  }, [filteredTotalPages, totalPages, debouncedSearchTerm, formatFilter, dateFilter]);

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 ">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
            Orders ({displayOrders.length})
          </h1>
          <h2 className="text-xl font-semibold text-primary dark:text-gray-300">
            Total Amount:{" "}
            <span>
              AU$
              {displayOrders
                .reduce((sum, order) => sum + order.total, 0)
                .toFixed(2)}
            </span>
          </h2>
        </div>

        <div className="w-full flex justify-end mb-4">
          <Button variant="primary" onClick={() => router.push('/admin/create-invoice')}>Create Invoice</Button>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <TextField
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full col-span-1 sm:col-span-1 lg:col-span-1"
          />
          <Select
            value={formatFilter}
            onChange={(value) => setFormatFilter(value as string)}
            options={[
              { label: "All", value: "All" },
              { label: "Partial", value: "partial" },
              { label: "Full", value: "full" },
            ]}
            placeholder="Format"
            className="w-full"
          />
          <Select
            value={dateFilter}
            onChange={(value) => {
              const val = value as string;
              setDateFilter(val);
              if (val !== "Custom Range") {
                setCustomStartDate(null);
                setCustomEndDate(null);
              }
            }}
            options={[
              { label: "All Time", value: "All Time" },
              { label: "Today", value: "Today" },
              { label: "Yesterday", value: "Yesterday" },
              { label: "This Week", value: "This Week" },
              { label: "This Month", value: "This Month" },
              { label: "Custom Range", value: "Custom Range" },
            ]}
            placeholder="Date Range"
            className="w-full"
          />
          {dateFilter === "Custom Range" && (
            <div className="flex flex-col sm:flex-row gap-3 col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <DatePicker
                value={customStartDate}
                onChange={(date) => setCustomStartDate(date)}
                selectsStart={true}
                startDate={customStartDate}
                endDate={customEndDate}
                maxDate={new Date()}
                placeholder="Start Date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
              <DatePicker
                value={customEndDate}
                onChange={(date) => setCustomEndDate(date)}
                selectsEnd={true}
                startDate={customStartDate}
                endDate={customEndDate}
                minDate={customStartDate || undefined}
                maxDate={new Date()}
                placeholder="End Date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>
          )}
          <Button
            variant="secondary"
            className="w-full h-full min-h-10"
            onClick={() => {
              setSearchTerm("");
              setFormatFilter("All");
              setDateFilter("All Time");
              setCustomStartDate(null);
              setCustomEndDate(null);
              setCurrentPage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>

        {loadingStates.fetchingOrders ? (
          <Skeleton />
        ) : displayOrders.length === 0 ? (
          <EmptyState message="No orders found." />
        ) : (
          <>
            <div className="w-full overflow-x-auto rounded-tl-xl rounded-tr-xl">
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-lightblue dark:bg-gray-800">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key as string}
                        className={`whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200`}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="border-b border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                  {displayOrders.map((order, index) => (
                    <React.Fragment key={order._id}>
                      <tr
                        className={`cursor-pointer border-b border-gray-200 transition-all duration-200 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${expandedOrderId === order._id
                          ? "bg-gray-50 dark:bg-gray-800"
                          : ""
                          }`}
                        onClick={() => toggleExpandedOrder(order._id)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key as string}
                            className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-gray-200"
                            style={col.width ? { width: col.width } : undefined}
                          >
                            {col.render
                              ? col.render(order, index)
                              : (order as any)[col.key]}
                          </td>
                        ))}
                      </tr>
                      {renderProductDetails(order.items, order._id, order)}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {displayTotalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={displayTotalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default OrdersPage;