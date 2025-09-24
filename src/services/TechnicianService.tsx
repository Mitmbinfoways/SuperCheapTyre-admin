import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Technician {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

interface TechnicianRes {
  items: Technician[];
  pagination: Pagination;
}

interface TechnicianFilter {
  currentPage?: number;
  itemsPerPage?: number;
  search?: string;
  from?: string;
  to?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const AddTechnician = async (
  payload: Technician,
): Promise<ApiResponse<TechnicianRes>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/technician`;
  try {
    const response = await postMethod<ApiResponse<TechnicianRes>, Technician>(
      url,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to add technician:", error);
    throw error;
  }
};

// Get technicians with pagination/filter
export const GetTechnicians = async (
  filter: TechnicianFilter = {},
): Promise<ApiResponse<TechnicianRes>> => {
  const { currentPage, itemsPerPage, search, from, to } = filter;
  const params: string[] = [];

  if (currentPage !== undefined) params.push(`page=${currentPage}`);
  if (itemsPerPage !== undefined) params.push(`limit=${itemsPerPage}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/technician${
    params.length ? `?${params.join("&")}` : ""
  }`;

  try {
    const response = await getMethod<ApiResponse<TechnicianRes>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch technicians:", error);
    throw error;
  }
};

export const UpdateTechnician = async (
  payload: Partial<Technician>,
): Promise<ApiResponse<Technician>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/technician`;
  try {
    const response = await patchMethod<
      ApiResponse<Technician>,
      Partial<Technician>
    >(url, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update technician:", error);
    throw error;
  }
};

// Delete a technician by ID
export const DeleteTechnician = async (
  id: string,
): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/technician/${id}`;
  try {
    const response = await deleteMethod<ApiResponse<null>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete technician:", error);
    throw error;
  }
};
