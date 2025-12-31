import { getMethod, patchMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  __v?: number;
}

export type UpdateAdminPayload = Partial<
  Pick<Admin, "name" | "phone" | "avatar" | "email">
> & {
  password?: string;
  oldPassword?: string;
  newPassword?: string;
};

export const GetAdminById = async (id: string): Promise<ApiResponse<Admin>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/${id}`;
  const response = await getMethod<ApiResponse<Admin>>(url);
  return response.data;
};

// Updated to handle FormData for image uploads
export const UpdateProfile = async (
  payload: UpdateAdminPayload & { id: string },
  file?: File
): Promise<ApiResponse<Admin>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/update`;

  let body: UpdateAdminPayload | FormData;

  if (file) {
    body = new FormData();
    body.append("id", payload.id);
    if (payload.name) body.append("name", payload.name);
    if (payload.email) body.append("email", payload.email);
    if (payload.phone) body.append("phone", payload.phone);
    if (file) body.append("avatar", file);
    if (payload.oldPassword) body.append("oldPassword", payload.oldPassword);
    if (payload.newPassword) body.append("newPassword", payload.newPassword);
  } else {
    body = payload;
  }

  const response = await patchMethod<ApiResponse<Admin>, typeof body>(url, body, {
    headers: file ? { "Content-Type": "multipart/form-data" } : undefined,
  });

  return response.data;
};
