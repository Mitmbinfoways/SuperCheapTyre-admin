"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getAllOrders, Order, OrderItem } from "@/services/OrderServices";
import Pagination from "@/components/ui/Pagination";

import { Toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/EmptyState";
import { FiEye, FiEyeOff } from "react-icons/fi";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatPhoneNumber } from "@/lib/utils";
import { MdModeEdit } from "react-icons/md";
import Link from "next/link";

type LoadingStates = {
  fetchingOrders: boolean;
  fetchingProducts: boolean;
};

const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [formatFilter, setFormatFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [dateFilter, setDateFilter] = useState<string>("All Time");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [showTotal, setShowTotal] = useState(true);

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
      const normalize = (str: string | undefined | null) =>
        (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      const searchNormalized = normalize(debouncedSearchTerm);

      filtered = filtered.filter((order) =>
        normalize(order.customer.name).includes(searchNormalized) ||
        normalize(order.customer.email).includes(searchNormalized) ||
        normalize(order.customer.phone).includes(searchNormalized)
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

  const filteredTotalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / pageSize);
  }, [filteredOrders.length, pageSize]);

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

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
  }, [fetchOrders]);

  // Store previous values of filters to avoid resetting page on mount
  const prevFilters = React.useRef({
    search: debouncedSearchTerm,
    format: formatFilter,
    date: dateFilter,
    start: customStartDate,
    end: customEndDate,
  });

  useEffect(() => {
    const hasChanged =
      debouncedSearchTerm !== prevFilters.current.search ||
      formatFilter !== prevFilters.current.format ||
      dateFilter !== prevFilters.current.date ||
      customStartDate !== prevFilters.current.start ||
      customEndDate !== prevFilters.current.end;

    if (hasChanged) {
      prevFilters.current = {
        search: debouncedSearchTerm,
        format: formatFilter,
        date: dateFilter,
        start: customStartDate,
        end: customEndDate,
      };

      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (current.get("page") !== "1") {
        current.set("page", "1");
        router.push(`${pathname}?${current.toString()}`);
      }
    }
  }, [debouncedSearchTerm, formatFilter, dateFilter, customStartDate, customEndDate]);

  const getTotalItems = (order: Order) => {
    const productCount = Array.isArray(order.items)
      ? order.items.reduce((total, item) => total + (item.quantity || 0), 0)
      : 0;
    const serviceCount = Array.isArray(order.serviceItems)
      ? order.serviceItems.length
      : 0;
    return productCount + serviceCount;
  };


  const columns = [
    {
      title: "SR.No",
      key: "index",
      width: "80px",
      render: (_: Order, i: number) => (
        <div className="text-center">
          {(currentPage - 1) * pageSize + i + 1}
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
      render: (order: Order) => formatPhoneNumber(order.customer.phone),
    },
    {
      title: "Order Date",
      key: "date",
      render: (order: Order) =>
        <div className="text-center">
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
        </div>
    },
    {
      title: "Product Count",
      key: "itemsCount",
      width: "50px",
      render: (order: Order) => (
        <div className="text-center">{getTotalItems(order)}</div>
      ),
    },
    {
      title: "Payment Status",
      key: "paymentStatus",
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

        return <div className="text-center"><Badge color={color} label={status} /></div>;
      },
    },
    {
      title: "Total (AU$)",
      key: "total",
      render: (order: Order) => `AU$${(order.subtotal + (order.charges || 0)).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (order: Order) => {
        const isPaymentFull = (() => {
          const payment = order?.payment;
          if (!payment) return false;
          if (Array.isArray(payment)) {
            return payment.some((p) => p?.status?.toUpperCase() === "FULL");
          }
          if (payment && typeof payment === "object") {
            return payment.status?.toUpperCase() === "FULL";
          }
          return false;
        })();

        return (
          <div className="flex items-center justify-start space-x-2 px-3">
            <Tooltip content="View Details">
              <FiEye
                size={18}
                className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                title="View Details"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/orders/${order._id}?page=${currentPage}`);
                }}
              />
            </Tooltip>
            {!isPaymentFull && (
              <Tooltip content="Edit Invoice">
                <Link href={`/orders/${order._id}/edit`}>
                  <MdModeEdit
                    size={16}
                    className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    title="Edit Invoice"
                  />
                </Link>
              </Tooltip>
            )}
          </div>
        );
      },
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
            Orders ({totalOrders})
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowTotal(!showTotal)}
              aria-label="Toggle amount visibility"
              className="!p-2"
            >
              {showTotal ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </Button>
            <h2 className="text-xl font-semibold text-primary dark:text-gray-300">
              Total Amount:{" "}
              <span>
                {showTotal
                  ? `AU$${displayOrders
                    .reduce((sum, order) => sum + order.subtotal, 0)
                    .toFixed(2)}`
                  : "AU$ ****"}
              </span>
            </h2>

          </div>
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
              const current = new URLSearchParams(Array.from(searchParams.entries()));
              current.set("page", "1");
              router.push(`${pathname}?${current.toString()}`);
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
                        className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key as string}
                            className="whitespace-nowrap py-3 px-1 text-sm text-gray-900 dark:text-gray-200"
                            style={col.width ? { width: col.width } : undefined}
                          >
                            {col.render
                              ? col.render(order, index)
                              : (order as any)[col.key]}
                          </td>
                        ))}
                      </tr>
                      {/* Product details are now only shown on the dedicated order details page */}
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
                  onPageChange={(page) => {
                    const current = new URLSearchParams(Array.from(searchParams.entries()));
                    current.set("page", String(page));
                    router.push(`${pathname}?${current.toString()}`);
                  }}
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