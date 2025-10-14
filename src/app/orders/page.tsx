"use client";

import React, { useState, useEffect } from 'react';
import { getAllOrders, Order, OrderItem } from '@/services/OrderServices';
import Pagination from '@/components/ui/Pagination';
import Image from 'next/image';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders({ page: currentPage, limit: pageSize });
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
      setPageSize(response.data.pagination.pageSize);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total items in an order
  const getTotalItems = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Toggle expanded order
  const toggleExpandedOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Render product image
  const renderProductImage = (item: OrderItem) => {
    // Based on the backend implementation, images are stored in /Product directory
    // So the URL should be: {API_URL}/Product/{filename}
    const imageUrl = item.productDetails.images?.[0] 
      ? `${process.env.NEXT_PUBLIC_API_URL}/Product/${item.productDetails.images[0]}`
      : null;

    if (!imageUrl) {
      return (
        <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center dark:bg-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
        </div>
      );
    }

    return (
      <div className="h-12 w-12 rounded overflow-hidden">
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
              fallback.className = "h-full w-full bg-gray-200 flex items-center justify-center dark:bg-gray-700";
              fallback.innerHTML = '<span class="text-xs text-gray-500 dark:text-gray-400">No Image</span>';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  };

  // Render product details in table row with 3 products per row
  const renderProductDetails = (items: OrderItem[], orderId: string) => {
    if (expandedOrderId !== orderId) return null;
    
    return (
      <tr>
        <td colSpan={6} className="p-0">
          <div className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-3">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-3 border rounded-lg bg-white dark:bg-gray-700">
                  {renderProductImage(item)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.productDetails.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">SKU: {item.productDetails.sku}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Qty: {item.quantity}</span>
                      <span>£{item.productDetails.price.toFixed(2)}</span>
                    </div>
                    <div className="text-right font-medium mt-1">
                      Total: £{(item.productDetails.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Define table columns (removed time slot column)
  const columns = [
    { 
      title: "Sr.No", 
      key: "index", 
      width: "80px",
      render: (_: Order, i: number) => (
        <div className="flex items-center">
          {(currentPage - 1) * pageSize + i + 1}
          <span className="ml-2">
            {/* Arrow rotates based on expanded state */}
            {expandedOrderId === orders[i]?._id ? (
              <IoIosArrowUp className="text-gray-500 dark:text-gray-400" />
            ) : (
              <IoIosArrowDown className="text-gray-500 dark:text-gray-400" />
            )}
          </span>
        </div>
      )
    },
    {
      title: "Customer Name",
      key: "customer.name",
      render: (order: Order) => order.customer.name
    },
    {
      title: "Phone",
      key: "customer.phone",
      render: (order: Order) => order.customer.phone
    },
    {
      title: "Email",
      key: "customer.email",
      render: (order: Order) => order.customer.email
    },
    {
      title: "Product Count",
      key: "itemsCount",
      render: (order: Order) => getTotalItems(order.items)
    },
    {
      title: "Total ($)",
      key: "total",
      render: (order: Order) => `$${order.total.toFixed(2)}`
    }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-500 text-center py-8">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-lightblue dark:bg-gray-800">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key as string}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 text-left`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700">
              {orders.map((order, index) => (
                <React.Fragment key={order._id}>
                  <tr
                    className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0 border-gray-200 dark:border-gray-700 cursor-pointer ${
                      expandedOrderId === order._id ? 'bg-gray-50 dark:bg-gray-800' : ''
                    }`}
                    onClick={() => toggleExpandedOrder(order._id)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key as string}
                        className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-200`}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        {col.render ? col.render(order, index) : (order as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                  {renderProductDetails(order.items, order._id)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found.</p>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex justify-center p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
      </div>
    </div>
  );
};

export default OrdersPage;