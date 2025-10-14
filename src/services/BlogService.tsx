import { deleteMethod, getMethod, patchMethod, postMethod } from "./methods";

const AUTH_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface BlogItem {
  image: string | File; // Can be a URL string or a File object
  content: string;
}

// Update the interface to properly handle File objects
interface BlogItemWithFile extends Omit<BlogItem, "image"> {
  image: File | string;
}

export interface Blog {
  _id: string;
  title: string;
  formate: "carousel" | "alternative" | "card" | "center";
  images: string[];
  content?: string;
  items: BlogItem[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPayload {
  title: string;
  formate: "carousel" | "alternative" | "card" | "center";
  content?: string;
  items?: BlogItemWithFile[];
  tags: string[]; // This should always be an array of strings
  isActive: boolean;
  images?: File[];
}

export interface UpdateBlogPayload {
  title?: string;
  formate?: "carousel" | "alternative" | "card" | "center";
  content?: string;
  items?: BlogItemWithFile[];
  existingImages?: string[];
  tags?: string[]; // This should always be an array of strings
  isActive?: boolean;
  images?: File[];
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type BlogRes = {
  blogs: Blog[];
  pagination: Pagination;
};

export const getAllBlogs = async (
  filter: { page?: number; limit?: number; search?: string } = {},
): Promise<ApiResponse<BlogRes>> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/blog${params.length ? `?${params.join("&")}` : ""}`;

  const response = await getMethod<ApiResponse<BlogRes>>(url);
  return response.data;
};

export const getBlogById = async (id: string): Promise<ApiResponse<Blog>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/blog/${id}`;
  const response = await getMethod<ApiResponse<Blog>>(url);
  return response.data;
};

export const createBlog = async (
  payload: BlogPayload,
): Promise<ApiResponse<Blog>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/blog`;
  const formData = new FormData();

  // Append basic fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => formData.append("images", file));
    } else if (key === "items" && Array.isArray(value)) {
      const itemsWithoutFiles = value.map((item) => ({
        content: item.content,
        image:
          item.image instanceof File
            ? "new_upload"
            : item.image || "placeholder.jpg",
      }));
      formData.append("items", JSON.stringify(itemsWithoutFiles));
    } else if (key === "tags" && Array.isArray(value)) {
      value.forEach((tag) => formData.append("tags", tag));
    } else if (
      typeof value === "object" &&
      value !== null &&
      key !== "items" &&
      key !== "images"
    ) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // For non-carousel formats, we also need to append item images
  if (payload.formate !== "carousel" && payload.items) {
    payload.items.forEach((item, index) => {
      // Check if item.image is a File object
      if (item.image && item.image instanceof File) {
        // Use the correct field name format that the backend expects
        formData.append(`itemImages`, item.image);
      }
    });
  }

  const response = await postMethod<ApiResponse<Blog>, FormData>(
    url,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return response.data;
};

export const updateBlog = async (
  id: string,
  payload: UpdateBlogPayload,
): Promise<ApiResponse<Blog>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/blog/${id}`;
  const formData = new FormData();

  // Append basic fields
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images" && Array.isArray(value)) {
      // Handle carousel images
      value.forEach((file) => formData.append("images", file));
    } else if (key === "items" && Array.isArray(value)) {
      // For non-carousel formats, we need to handle images differently
      const itemsWithoutFiles = value.map((item) => ({
        content: item.content,
        image:
          item.image instanceof File
            ? "new_upload"
            : item.image || "placeholder.jpg",
      }));
      formData.append("items", JSON.stringify(itemsWithoutFiles));
    } else if (key === "tags" && Array.isArray(value)) {
      // Send each tag as a separate form field to create an array on the backend
      value.forEach((tag) => formData.append("tags", tag));
    } else if (
      typeof value === "object" &&
      value !== null &&
      key !== "items" &&
      key !== "images"
    ) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // For non-carousel formats, we also need to append item images
  if (payload.formate !== "carousel" && payload.items) {
    payload.items.forEach((item, index) => {
      // Check if item.image is a File object
      if (item.image && item.image instanceof File) {
        // Use the correct field name format that the backend expects
        formData.append(`itemImages`, item.image);
      }
    });
  }

  const response = await patchMethod<ApiResponse<Blog>, FormData>(
    url,
    formData,
    {
      method: "PATCH",
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const deleteBlog = async (id: string): Promise<ApiResponse<null>> => {
  const url = `${AUTH_SERVICE_BASE_URL}/api/v1/blog/${id}`;
  const response = await deleteMethod<ApiResponse<null>>(url);
  return response.data;
};
