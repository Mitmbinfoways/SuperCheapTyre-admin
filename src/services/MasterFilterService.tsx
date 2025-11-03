import { getMethod, postMethod, patchMethod, deleteMethod } from "./methods";

// Define TypeScript interfaces for the MasterFilter data structure
export interface MasterFilter {
  _id: string;
  category: string;
  subCategory: string;
  values: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Add pagination interface
export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface MasterFilterResponse {
  items: MasterFilter[];
  pagination: Pagination;
}

export interface MasterFilterApiResponse {
  statusCode: number;
  data: MasterFilterResponse;
  message: string;
}

// Get all master filters with pagination support
export const getAllMasterFilters = async (
  filter: { page?: number; limit?: number; search?: string } = {}
): Promise<MasterFilterApiResponse> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `/api/v1/masterFilter${params.length ? `?${params.join("&")}` : ""}`;
  
  const response = await getMethod<MasterFilterApiResponse>(url);
  return response.data;
};

// Get a single master filter by ID
export const getMasterFilterById = async (id: string): Promise<MasterFilter> => {
  const response = await getMethod<MasterFilter>(`/api/v1/masterFilter/${id}`);
  return response.data;
};

// Create a new master filter
export const createMasterFilter = async (
  payload: { category: string; subCategory: string; values: string }
): Promise<any> => {
  const response = await postMethod<any, typeof payload>(
    `/api/v1/masterFilter`,
    payload
  );
  return response.data;
};

// Update master filter
export const updateMasterFilter = async (
  id: string,
  payload: { category: string; subCategory: string; values: string }
): Promise<any> => {
  const response = await patchMethod<any, typeof payload>(
    `/api/v1/masterFilter/${id}`,
    payload
  );
  return response.data;
};

// Delete master filter
export const deleteMasterFilter = async (id: string): Promise<any> => {
  const response = await deleteMethod<any>(`/api/v1/masterFilter/${id}`);
  return response.data;
};