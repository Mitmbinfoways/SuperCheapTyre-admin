import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface TyreSpecifications {
  pattern?: string;
  width?: string;
  profile?: string;
  diameter?: string;
  loadRating?: string;
  speedRating?: string;
}

export interface WheelSpecifications {
  size?: string;
  color?: string;
  diameter?: string;
  fitments?: string;
  staggeredOptions?: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  images: string[];
  sku: string;
  price: number;
  stock: number;
  tyreSpecifications?: TyreSpecifications;
  wheelSpecifications?: WheelSpecifications;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  name: string;
  category: string;
  brand: string;
  description?: string;
  images?: File[]; // For uploads
  sku: string;
  price: number;
  stock: number;
  tyreSpecifications?: TyreSpecifications;
  wheelSpecifications?: WheelSpecifications;
  isActive?: boolean;
}

export type UpdateProductPayload = Partial<ProductPayload> & {
  // List of existing image filenames to keep on update
  keepImages?: string[];
};

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type ProductRes = {
  items: Product[];
  pagination: Pagination;
};

export const getAllProducts = async (
  filter: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<ProductRes>> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/product${params.length ? `?${params.join("&")}` : ""}`;

  const response = await getMethod<ApiResponse<ProductRes>>(url);
  return response.data;
};

export const getProductById = async (
  id: string,
): Promise<ApiResponse<Product>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/product/${id}`;
  const response = await getMethod<ApiResponse<Product>>(url);
  return response.data;
};

export const createProduct = async (
  payload: ProductPayload,
): Promise<ApiResponse<Product>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/product`;
  const formData = new FormData();

  // Append fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => formData.append("images", file));
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await postMethod<ApiResponse<Product>, FormData>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload,
): Promise<ApiResponse<Product>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/product/${id}`;
  const formData = new FormData();

  // Append keep list first if provided (backend reads req.body.images)
  if (Array.isArray(payload.keepImages)) {
    formData.append("images", JSON.stringify(payload.keepImages));
  }

  // Append new upload files
  if (Array.isArray(payload.images)) {
    payload.images.forEach((file) => formData.append("images", file));
  }

  // Append remaining scalar/object fields (excluding images/keepImages)
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images" || key === "keepImages") return;
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value as any));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await patchMethod<ApiResponse<Product>, FormData>(
    url,
    formData,
    {
      method: "PATCH",
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/product/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};
