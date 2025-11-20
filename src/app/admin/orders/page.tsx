"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getAllOrders, Order, OrderItem } from "@/services/OrderServices";
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

type LoadingStates = {
  fetchingOrders: boolean;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingOrders: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const fetchOrders = useCallback(async () => {
    updateLoadingState("fetchingOrders", true);
    try {
      const response = await getAllOrders({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
      });
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to fetch orders",
      });
    } finally {
      updateLoadingState("fetchingOrders", false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

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

  const renderProductDetails = (items: OrderItem[], orderId: string) => {
    const isExpanded = expandedOrderId === orderId;

    return (
      <tr>
        <td colSpan={8} className="p-0">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="bg-gray-50 p-4 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-200">
                Product Details
              </h3>
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
            {expandedOrderId === orders[i]?._id ? (
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
      render: (order: Order) => (
        <div className="text-center">{getTotalItems(order.items)}</div>
      ),
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
        <div
          onClick={(e) => {
            e.stopPropagation();
            downloadInvoice(order._id);
          }}
          className="flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Tooltip content="Download Invoice">
            <FiDownload
              size={18}
              className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title="Download"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-900 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Orders ({orders.length})
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6 w-full sm:w-1/3">
        <TextField
          type="text"
          placeholder="Search by customer name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loadingStates.fetchingOrders ? (
        <Skeleton />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found." />
      ) : (
        <>
          {/* ✅ Responsive table wrapper */}
          <div className="w-full overflow-x-auto rounded-tl-xl rounded-tr-xl">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-lightblue dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key as string}
                      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200`}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="border-b border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                {orders.map((order, index) => (
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
                          className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-200"
                          style={col.width ? { width: col.width } : undefined}
                        >
                          {col.render
                            ? col.render(order, index)
                            : (order as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                    {renderProductDetails(order.items, order._id)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;