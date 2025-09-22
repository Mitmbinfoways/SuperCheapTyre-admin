import { getMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Appointment {
  _id: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  date: string;
  slotId: string;
  status: string;
  timeSlotId: string;
  notes: string;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type AppointmentResponse = {
  items: Appointment[];
  pagination: Pagination;
};

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

interface AppointmentFilter {
  currentPage?: number;
  itemsPerPage?: number;
  search?: string;
  from?: string;
  to?: string;
}

export const GetAllAppointments = async (
  filter: AppointmentFilter = {}
): Promise<ApiResponse<AppointmentResponse>> => {
  try {
    const {
      currentPage = 1,
      itemsPerPage = 10,
      search,
    } = filter;

    const params: string[] = [];
    params.push(`page=${currentPage}`);
    params.push(`limit=${itemsPerPage}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/appointment?${params.join("&")}`;
    const response = await getMethod<ApiResponse<AppointmentResponse>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch appointments:", error);
    return {
      statusCode: error?.response?.status || 500,
      data: { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 10 } },
      message: error?.message || "Failed to fetch appointments",
    };
  }
};
