import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Brand {
  _id: string;
  name: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandPayload {
  name: string;
  isActive: boolean;
  image?: File;
}

export interface UpdateBrandPayload {
  name?: string;
  isActive?: boolean;
  image?: File;
}

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

type BrandRes = {
  items: Brand[];
  pagination: Pagination;
};

export const getAllBrands = async (
  filter: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<BrandRes>> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/brand${params.length ? `?${params.join("&")}` : ""}`;

  const response = await getMethod<ApiResponse<BrandRes>>(url);
  return response.data;
};

export const getBrandById = async (
  id: string,
): Promise<ApiResponse<Brand>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/brand/${id}`;
  const response = await getMethod<ApiResponse<Brand>>(url);
  return response.data;
};

export const createBrand = async (
  payload: BrandPayload,
): Promise<ApiResponse<Brand>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/brand`;
  const formData = new FormData();

  // Append fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "image" && value instanceof File) {
      formData.append("image", value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await postMethod<ApiResponse<Brand>, FormData>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const updateBrand = async (
  id: string,
  payload: UpdateBrandPayload,
): Promise<ApiResponse<Brand>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/brand/${id}`;
  const formData = new FormData();

  // Append fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "image" && value instanceof File) {
      formData.append("image", value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await patchMethod<ApiResponse<Brand>, FormData>(
    url,
    formData,
    {
      method: "PATCH",
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deleteBrand = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/brand/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};