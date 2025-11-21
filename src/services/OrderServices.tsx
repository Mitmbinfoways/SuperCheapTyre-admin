import { getMethod, postMethod, putMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ProductDetails {
  _id: string;
  name: string;
  images: string[];
  sku: string;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  _id: string;
  productDetails: ProductDetails;
}

export interface Appointment {
  date: string;
  slotId: string;
  timeSlotId: string;
  _id: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  _id: string;
}

export interface Payment {
  method: string;
  status: string;
  transactionId: string;
  amount: number;
  currency: string;
  providerPayload: {
    gateway: string;
    cardLast4: string;
  };
  _id: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  appointment: Appointment;
  createdAt: string;
  customer: Customer;
  payment: Payment;
}

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OrderRes {
  orders: Order[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

export const getAllOrders = async (
  filter: { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string; dateFilter?: string } = {},
): Promise<ApiResponse<OrderRes>> => {
  const params: string[] = [];

  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.status !== undefined) params.push(`status=${filter.status}`);
  if (filter.dateFilter) params.push(`dateFilter=${filter.dateFilter}`);
  if (filter.startDate) params.push(`startDate=${filter.startDate}`);
  if (filter.endDate) params.push(`endDate=${filter.endDate}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/order${params.length ? `?${params.join("&")}` : ""
    }`;

  const response = await getMethod<ApiResponse<OrderRes>>(url);
  return response.data;
};

export interface CreateLocalOrderPayload {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  subtotal: number;
  total: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  payment: {
    amount: number;
    method: string;
    status: string;
    currency: string;
    note: string;
  };
}

export const CreateLocalOrder = async (
  payload: CreateLocalOrderPayload,
): Promise<ApiResponse<Order>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/order/local`;
  const response = await postMethod<ApiResponse<Order>, CreateLocalOrderPayload>(url, payload);
  return response.data;
};

export interface UpdateOrderPayload {
  method?: string;
  amount: number;
  status: string;
  note?: string;
}

export const updateOrder = async (
  orderId: string,
  payload: UpdateOrderPayload,
): Promise<ApiResponse<Order>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/order/${orderId}`;
  const response = await putMethod<ApiResponse<Order>, UpdateOrderPayload>(url, payload);
  return response.data;
};
