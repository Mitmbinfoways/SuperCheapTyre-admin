import { postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Admin {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  lastLogin: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  token: string;
  newPassword: string;
}

export interface SendOTPPayload {
  email: string;
}

export interface AuthData {
  token: string;
  admin: Admin;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

// Sign In
export const signIn = async (
  payload: SignInPayload
): Promise<ApiResponse<AuthData>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/login`;
  const response = await postMethod<ApiResponse<AuthData>>(url, payload);
  return response.data;
};

// Forgot Password
export const forgotPassword = async (
  payload: ForgotPasswordPayload
): Promise<ApiResponse<{ message: string }>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/forgot-password`;
  const response = await postMethod<ApiResponse<{ message: string }>>(url, payload);
  return response.data;
};

// Send OTP
export const RequestReset = async (
  payload: SendOTPPayload
): Promise<ApiResponse<{ message: string }>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/request-reset`;
  const response = await postMethod<ApiResponse<{ message: string }>>(url, payload);
  return response.data;
};
