import { deleteMethod, getMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Holiday {
  _id: string;
  date: string;
  reason: string;
  createdBy?: string;
}

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

export const AddHoliday = async (
  payload: HolidayPayload,
): Promise<ApiResponse<Holiday>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/holiday`;
  try {
    const response = await postMethod<ApiResponse<Holiday>, HolidayPayload>(
      url,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to add holiday:", error);
    throw error;
  }
};

export const GetHolidays = async (): Promise<ApiResponse<Holiday[]>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/holiday`;
  try {
    const response = await getMethod<ApiResponse<Holiday[]>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch holidays:", error);
    throw error;
  }
};

export const DeleteHoliday = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/holiday/${id}`;
  try {
    const response = await deleteMethod<ApiResponse<null>>(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete holiday:", error);
    throw error;
  }
};
