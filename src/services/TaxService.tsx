import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Tax {
  _id: string;
  name: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxPayload {
  name?: string;
  percentage: number;
}

export interface UpdateTaxPayload {
  name?: string;
  percentage?: number;
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

type TaxRes = {
  items: Tax[];
  pagination: Pagination;
};

export const createTax = async (
  payload: TaxPayload
): Promise<ApiResponse<Tax>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/tax`;

  const response = await postMethod<ApiResponse<Tax>, TaxPayload>(
    url,
    payload
  );

  return response.data;
};

export const getAllTaxes = async (
  filter: { page?: number; limit?: number } = {}
): Promise<ApiResponse<TaxRes>> => {
  const params: string[] = [];

  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/tax${params.length ? `?${params.join("&")}` : ""
    }`;

  const response = await getMethod<ApiResponse<TaxRes>>(url);
  return response.data;
};

export const getTaxById = async (
  id: string
): Promise<ApiResponse<Tax>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/tax/${id}`;
  const response = await getMethod<ApiResponse<Tax>>(url);
  return response.data;
};

export const updateTax = async (
  id: string,
  payload: UpdateTaxPayload
): Promise<ApiResponse<Tax>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/tax/${id}`;

  const response = await patchMethod<ApiResponse<Tax>, UpdateTaxPayload>(
    url,
    payload,
    {
      method: "PATCH",
    }
  );

  return response.data;
};

export const deleteTax = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/tax/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};
