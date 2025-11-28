import { getMethod, postMethod, putMethod, deleteMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const CreateContactInfo = async (data: any) => {
    const response = await postMethod(`${AUTH_SERVICE_BASE_URL}/api/v1/contact-info`, data);
    return response.data;
};

export const GetContactInfo = async () => {
    const response = await getMethod(`${AUTH_SERVICE_BASE_URL}/api/v1/contact-info`);
    return response.data;
};

export const UpdateContactInfo = async (id: string, data: any) => {
    const response = await putMethod(`${AUTH_SERVICE_BASE_URL}/api/v1/contact-info/${id}`, data);
    return response.data;
};

export const DeleteContactInfo = async (id: string) => {
    const response = await deleteMethod(`${AUTH_SERVICE_BASE_URL}/api/v1/contact-info/${id}`);
    return response.data;
};
