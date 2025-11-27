import { deleteMethod, getMethod, patchMethod, postMethod, putMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Banner {
  _id: string;
  laptopImage: string;
  mobileImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  laptopImage: File;
  mobileImage: File;
  isActive: boolean;
}

export interface UpdateBannerPayload {
  laptopImage?: File;
  mobileImage?: File;
  isActive?: boolean;
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

type BannerRes = {
  items: Banner[];
  pagination: Pagination;
};

export const getAllBanners = async (
  filter: { page?: number; limit?: number; search?: string; isActive?: boolean } = {},
): Promise<ApiResponse<Banner[]>> => {
  // The backend currently returns a simple array of banners, not a paginated response
  const params: string[] = [];
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);
  if (filter.isActive !== undefined) params.push(`isActive=${filter.isActive}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner${params.length ? `?${params.join("&")}` : ""}`;

  const response = await getMethod<ApiResponse<Banner[]>>(url);
  return response.data;
};

export const getBannerById = async (
  id: string,
): Promise<ApiResponse<Banner>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner/${id}`;
  const response = await getMethod<ApiResponse<Banner>>(url);
  return response.data;
};

export const createBanner = async (
  payload: BannerPayload,
): Promise<ApiResponse<Banner>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner/single`;
  const formData = new FormData();

  // Append files
  formData.append("laptopImage", payload.laptopImage);
  formData.append("mobileImage", payload.mobileImage);
  formData.append("isActive", String(payload.isActive));

  const response = await postMethod<ApiResponse<Banner>, FormData>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const updateBanner = async (
  id: string,
  payload: UpdateBannerPayload,
): Promise<ApiResponse<Banner>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner/${id}`;
  const formData = new FormData();

  // Append fields
  Object.entries(payload).forEach(([key, value]) => {
    if ((key === "laptopImage" || key === "mobileImage") && value instanceof File) {
      formData.append(key, value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await patchMethod<ApiResponse<Banner>, FormData>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deleteBanner = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};

export const updateBannerSequence = async (
  banners: { _id: string }[],
): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/banner/sequence`;
  const response = await putMethod<ApiResponse<null>>(url, { banners });
  return response.data;
};