import { postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface TwoFactorSetupResponse {
    secret: string;
    qrCode: string;
}

export interface VerifyResponse {
    backupCodes?: string[];
    token?: string;
    admin?: any;
}

const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem("authToken") : "";
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Initiate Setup (Get QR Code)
export const setup2FA = async () => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/2fa/setup`;
    const response = await postMethod<{ statusCode: number; data: TwoFactorSetupResponse }>(
        url,
        {},
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Verify and Enable 2FA
export const verify2FASetup = async (token: string) => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/2fa/verify-setup`;
    const response = await postMethod<{ statusCode: number; data: VerifyResponse }>(
        url,
        { token },
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Login with 2FA
export const verify2FALogin = async (tempToken: string, token: string) => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/2fa/verify-login`;
    const response = await postMethod<{ statusCode: number; data: VerifyResponse; message: string }>(
        url,
        { tempToken, token }
    );
    return response.data;
};

// Disable 2FA
export const disable2FA = async (password: string) => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/2fa/disable`;
    const response = await postMethod<{ statusCode: number }>(
        url,
        { password },
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Request 2FA Reset (Forgot OTP)
export const request2FAReset = async (tempToken: string) => {
    const url = `${AUTH_SERVICE_BASE_URL}/api/v1/admin/2fa/forgot`;
    const response = await postMethod<{ statusCode: number; message: string }>(
        url,
        { tempToken }
    );
    return response;
};
