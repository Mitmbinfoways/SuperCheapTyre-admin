import { postMethod, getMethod, patchMethod, deleteMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface BreakTime {
  start: string;
  end: string;
}

export interface GeneratedSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  _id: string;
}

export interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  breakTime?: BreakTime | null;
  generatedSlots?: GeneratedSlot[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface TimeSlotPayload {
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  breakTime?: BreakTime | null;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

// API functions
export const getAllTimeSlots = async (
  filter: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiResponse<TimeSlot[]>> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/timeslot${params.length ? `?${params.join("&")}` : ""}`;
  const response = await getMethod<ApiResponse<TimeSlot[]>>(url);
  return response.data;
};

export const getTimeSlotById = async (id: string): Promise<ApiResponse<TimeSlot>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/timeslot/${id}`;
  const response = await getMethod<ApiResponse<TimeSlot>>(url);
  return response.data;
};

export const createTimeSlot = async (payload: TimeSlotPayload): Promise<ApiResponse<TimeSlot>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/timeslot`;
  const response = await postMethod<ApiResponse<TimeSlot>, TimeSlotPayload>(url, payload);
  return response.data;
};

export const updateTimeSlot = async (
  id: string,
  payload: Partial<TimeSlotPayload>
): Promise<ApiResponse<TimeSlot>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/timeslot/${id}`;
  const response = await patchMethod<ApiResponse<TimeSlot>, Partial<TimeSlotPayload>>(url, payload);
  return response.data;
};

export const deleteTimeSlot = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/timeslot/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};
