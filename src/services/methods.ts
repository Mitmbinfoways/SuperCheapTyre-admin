import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 120000, // 2 minutes
  maxContentLength: 50 * 1024 * 1024, // 50 MB
  maxBodyLength: 50 * 1024 * 1024, // 50 MB
});

// Common interface for API responses
export interface ApiResponse<T = any> {
  data: T;
  status: number;
}

// Generic request handler
const requestHandler = async <T = any>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: any,
  config: AxiosRequestConfig = {},
): Promise<ApiResponse<T>> => {
  const source: CancelTokenSource = axios.CancelToken.source();
  const finalConfig: AxiosRequestConfig = {
    ...config,
    cancelToken: source.token,
  };

  try {
    let response: AxiosResponse<T>;

    switch (method) {
      case "get":
        response = await apiClient.get<T>(url, finalConfig);
        break;
      case "post":
        response = await apiClient.post<T>(url, data, finalConfig);
        break;
      case "put":
        response = await apiClient.put<T>(url, data, finalConfig);
        break;
      case "patch":
        response = await apiClient.patch<T>(url, data, finalConfig);
        break;
      case "delete":
        response = await apiClient.delete<T>(url, finalConfig);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return { data: response.data, status: response.status };
  } catch (error: any) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else if (error instanceof AxiosError) {
      console.error(
        `Axios error during ${method.toUpperCase()} request:`,
        error.response?.data || error.message,
      );
    } else {
      console.error(
        `Unknown error during ${method.toUpperCase()} request:`,
        error,
      );
    }
    throw error;
  }
};

// Exported helper methods
export const getMethod = <T = any>(url: string, config?: AxiosRequestConfig) =>
  requestHandler<T>("get", url, undefined, config);

export const postMethod = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) => requestHandler<T>("post", url, data, config);

export const putMethod = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) => requestHandler<T>("put", url, data, config);

export const patchMethod = <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
) => requestHandler<T>("patch", url, data, config);

export const deleteMethod = <T = any>(
  url: string,
  config?: AxiosRequestConfig,
) => requestHandler<T>("delete", url, undefined, config);
