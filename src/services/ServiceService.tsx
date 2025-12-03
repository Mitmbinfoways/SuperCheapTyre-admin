import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Service {
    _id: string;
    name: string;
    description?: string;
    images: string[];
    price: number;
    isActive: boolean;
    cart_Recommended?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ServicePayload {
    name: string;
    description?: string;
    images?: File[]; // For uploads
    price: number;
    isActive?: boolean;
    cart_Recommended?: boolean;
}

export type UpdateServicePayload = Partial<ServicePayload> & {
    keepImages?: string[];
};

export interface ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
}

export const getAllServices = async (
    filter: { isActive?: boolean } = {},
): Promise<ApiResponse<Service[]>> => {
    const params: string[] = [];
    if (filter.isActive !== undefined) params.push(`isActive=${filter.isActive}`);

    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/service${params.length ? `?${params.join("&")}` : ""}`;

    const response = await getMethod<ApiResponse<Service[]>>(url);
    return response.data;
};

export const getServiceById = async (
    id: string,
): Promise<ApiResponse<Service>> => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/service/${id}`;
    const response = await getMethod<ApiResponse<Service>>(url);
    return response.data;
};

export const createService = async (
    payload: ServicePayload,
): Promise<ApiResponse<Service>> => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/service`;
    const formData = new FormData();

    // Append fields
    Object.entries(payload).forEach(([key, value]) => {
        if (key === "images" && Array.isArray(value)) {
            value.forEach((file) => formData.append("images", file));
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    const response = await postMethod<ApiResponse<Service>, FormData>(
        url,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
        },
    );

    return response.data;
};

export const updateService = async (
    id: string,
    payload: UpdateServicePayload,
): Promise<ApiResponse<Service>> => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/service/${id}`;
    const formData = new FormData();

    // Append keep list first if provided
    if (Array.isArray(payload.keepImages)) {
        formData.append("images", JSON.stringify(payload.keepImages));
    }

    // Append new upload files
    if (Array.isArray(payload.images)) {
        payload.images.forEach((file) => formData.append("images", file));
    }

    // Append remaining scalar fields
    Object.entries(payload).forEach(([key, value]) => {
        if (key === "images" || key === "keepImages") return;
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    const response = await patchMethod<ApiResponse<Service>, FormData>(
        url,
        formData,
        {
            method: "PATCH",
            headers: { "Content-Type": "multipart/form-data" },
        },
    );
    return response.data;
};

export const deleteService = async (id: string): Promise<ApiResponse<null>> => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/service/${id}`;
    const response = await deleteMethod<ApiResponse<null>>(url);
    return response.data;
};
