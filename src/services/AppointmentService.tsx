import { getMethod, patchMethod, postMethod } from "./methods";

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
  slotDetails: {
    startTime: string;
    endTime: string;
    isBreak: boolean;
  };
  technicianDetails: {
    firstName: string;
    lastName: string;
  };
  timeSlotId: string;
  notes: string;
  Employee?: string;
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

export interface AppointmentPayload {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  date: string;
  slotId: string;
  timeSlotId: string;
  notes?: string;
  status?: string;
  Employee?: string;
}

export type UpdateAppointmentPayload = Partial<AppointmentPayload>;

interface AppointmentFilter {
  currentPage?: number;
  itemsPerPage?: number;
  search?: string;
  from?: string;
  to?: string;
}

export const GetAllAppointments = async (
  filter: AppointmentFilter = {},
): Promise<ApiResponse<AppointmentResponse>> => {
  try {
    const { currentPage, itemsPerPage, search } = filter;

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
      data: {
        items: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
        },
      },
      message: error?.message || "Failed to fetch appointments",
    };
  }
};

export const updateAppointment = async (
  id: string,
  payload: UpdateAppointmentPayload,
): Promise<ApiResponse<Appointment>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/appointment/${id}`;
  const response = await patchMethod<
    ApiResponse<Appointment>,
    UpdateAppointmentPayload
  >(url, payload);
  return response.data;
};

export const createAppointment = async (
  payload: AppointmentPayload
): Promise<ApiResponse<Appointment>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/appointment`;
  const response = await postMethod<ApiResponse<Appointment>, AppointmentPayload>(
    url,
    payload
  );
  return response.data;
};

export const getAppointmentById = async (
  id: string
): Promise<ApiResponse<Appointment>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/appointment/${id}`;
  const response = await getMethod<ApiResponse<Appointment>>(url);
  return response.data;
};

export const getAvailableSlots = async (
  date: string,
  timeSlotId?: string
): Promise<ApiResponse<{ date: string; slots: any[] }>> => {
  let url = `${AUTH_SERVICE_BASE_URL}/api/v1/appointment/slots?date=${date}`;
  if (timeSlotId) {
    url += `&timeSlotId=${timeSlotId}`;
  }
  const response = await getMethod<ApiResponse<{ date: string; slots: any[] }>>(
    url
  );
  return response.data;
};
