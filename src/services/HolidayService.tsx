import { deleteMethod, getMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Holiday {
  _id: string;
  date: string;
  reason: string;
  createdBy?: string;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type HolidayResponse = {
  items: Holiday[];
  pagination: Pagination;
};

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

interface HolidayPayload {
  id?: string;
  date: string;
  reason: string;
}

interface HolidayFilter {
  currentPage?: number;
  itemsPerPage?: number;
  search?: string;
  from?: string;
  to?: string;
}

export const AddHoliday = async (
  payload: HolidayPayload,
): Promise<ApiResponse<HolidayResponse>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/holiday`;
  try {
    const response = await postMethod<ApiResponse<HolidayResponse>, HolidayPayload>(
      url,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to add holiday:", error);
    throw error;
  }
};

export const GetHolidays = async (
  filter: HolidayFilter = {},
): Promise<ApiResponse<HolidayResponse>> => {
  const { currentPage, itemsPerPage, search, from, to } = filter;
  const params: string[] = [];
  if (currentPage !== undefined) params.push(`page=${currentPage}`);
  if (itemsPerPage !== undefined) params.push(`limit=${itemsPerPage}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/holiday${params.length ? `?${params.join("&")}` : ""}`;

  try {
    const response = await getMethod<ApiResponse<HolidayResponse>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch holidays:", error);
    throw error;
  }
};

export const DeleteHoliday = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/holiday/${id}`;
  try {
    const response = await deleteMethod<ApiResponse<null>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete holiday:", error);
    throw error;
  }
};
