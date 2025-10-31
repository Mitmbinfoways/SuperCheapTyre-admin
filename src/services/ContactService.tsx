import { getMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Contact {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type ContactResponse = {
  items: Contact[];
  pagination: Pagination;
};

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

interface ContactFilter {
  currentPage?: number;
  itemsPerPage?: number;
  search?: string;
  from?: string;
  to?: string;
}

export const GetContacts = async (
  filter: ContactFilter = {},
): Promise<ApiResponse<ContactResponse>> => {
  const { currentPage, itemsPerPage, search, from, to } = filter;
  const params: string[] = [];
  if (currentPage !== undefined) params.push(`page=${currentPage}`);
  if (itemsPerPage !== undefined) params.push(`limit=${itemsPerPage}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/contact${params.length ? `?${params.join("&")}` : ""
    }`;

  const response = await getMethod<ApiResponse<ContactResponse>>(url);
  return response.data;
};


