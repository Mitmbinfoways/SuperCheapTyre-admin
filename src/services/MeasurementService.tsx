import { getMethod, postMethod, deleteMethod } from "./methods";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Measurement {
  id: string;
  category: "tyre" | "wheel";
  type: string;
  value: string;
  createdAt: string;
}

export interface CreateMeasurementPayload {
  category: "tyre" | "wheel";
  type: string;
  value: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
}

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type MeasurementsRes = {
  items: Measurement[];
  pagination: Pagination;
};

// Mock data for measurements
let mockMeasurements: Measurement[] = [
  { id: "1", category: "tyre", type: "width", value: "195", createdAt: "2023-05-15" },
  { id: "2", category: "tyre", type: "diameter", value: "15", createdAt: "2023-05-16" },
  { id: "3", category: "wheel", type: "size", value: "16 inch", createdAt: "2023-05-17" },
  { id: "4", category: "tyre", type: "profile", value: "65", createdAt: "2023-05-18" },
  { id: "5", category: "wheel", type: "color", value: "Silver", createdAt: "2023-05-19" },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all measurements
export const getAllMeasurements = async (
  filter: { page?: number; limit?: number; search?: string; category?: string } = {}
): Promise<ApiResponse<MeasurementsRes>> => {
  // Simulate API call delay
  await delay(500);
  
  let result = [...mockMeasurements];
  
  // Apply filters
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(m => 
      m.type.toLowerCase().includes(searchLower) || 
      m.value.toLowerCase().includes(searchLower)
    );
  }
  
  if (filter.category) {
    result = result.filter(m => m.category === filter.category);
  }
  
  // Pagination
  const page = filter.page || 1;
  const limit = filter.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = result.slice(startIndex, endIndex);
  
  const response: ApiResponse<MeasurementsRes> = {
    statusCode: 200,
    data: {
      items,
      pagination: {
        totalItems: result.length,
        totalPages: Math.ceil(result.length / limit),
        currentPage: page,
        pageSize: limit,
      },
    },
    message: "Measurements retrieved successfully",
  };
  
  return response;
};

// Create a new measurement
export const createMeasurement = async (
  payload: CreateMeasurementPayload
): Promise<ApiResponse<Measurement>> => {
  // Simulate API call delay
  await delay(500);
  
  const newMeasurement: Measurement = {
    id: String(mockMeasurements.length + 1),
    category: payload.category,
    type: payload.type,
    value: payload.value,
    createdAt: new Date().toISOString().split('T')[0],
  };
  
  mockMeasurements.push(newMeasurement);
  
  const response: ApiResponse<Measurement> = {
    statusCode: 201,
    data: newMeasurement,
    message: "Measurement created successfully",
  };
  
  return response;
};

// Delete a measurement
export const deleteMeasurement = async (id: string): Promise<ApiResponse<null>> => {
  // Simulate API call delay
  await delay(500);
  
  const index = mockMeasurements.findIndex(m => m.id === id);
  if (index !== -1) {
    mockMeasurements.splice(index, 1);
  }
  
  const response: ApiResponse<null> = {
    statusCode: 200,
    data: null,
    message: "Measurement deleted successfully",
  };
  
  return response;
};