import { getMethod, postMethod, patchMethod, deleteMethod } from "./methods";

// Define TypeScript interfaces for the MasterFilter data structure
export interface MasterFilterOption {
  _id: string;
  name: string;
}

export interface TyreSpecifications {
  pattern: MasterFilterOption[];
  width: MasterFilterOption[];
  profile: MasterFilterOption[];
  diameter: MasterFilterOption[];
  loadRating: MasterFilterOption[];
  speedRating: MasterFilterOption[];
  _id?: string;
}

export interface WheelSpecifications {
  size: MasterFilterOption[];
  color: MasterFilterOption[];
  diameter: MasterFilterOption[];
  fitments: MasterFilterOption[];
  staggeredOptions: MasterFilterOption[];
  _id?: string;
}

export interface MasterFilter {
  _id: string;
  tyres: TyreSpecifications;
  wheels: WheelSpecifications;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Add pagination interface
export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface MasterFilterResponse {
  items: MasterFilter[];
  pagination: Pagination;
}

export interface MasterFilterApiResponse {
  statusCode: number;
  data: MasterFilterResponse;
  message: string;
}

// Get all master filters with pagination support
export const getAllMasterFilters = async (
  filter: { page?: number; limit?: number; search?: string } = {}
): Promise<MasterFilterApiResponse> => {
  const params: string[] = [];
  if (filter.page !== undefined) params.push(`page=${filter.page}`);
  if (filter.limit !== undefined) params.push(`limit=${filter.limit}`);
  if (filter.search) params.push(`search=${encodeURIComponent(filter.search)}`);

  const url = `/api/v1/masterFilter${params.length ? `?${params.join("&")}` : ""}`;
  
  const response = await getMethod<MasterFilterApiResponse>(url);
  return response.data;
};

// Create a new measurement (add to existing master filter)
export const createMeasurement = async (
  payload: { category: "tyre" | "wheel"; type: string; value: string }
): Promise<MasterFilterApiResponse> => {
  // First, get the existing master filter to get its ID
  const masterFilters = await getAllMasterFilters();
  const masterFilter = masterFilters.data.items[0];
  
  if (!masterFilter) {
    throw new Error("No master filter found");
  }
  
  // Prepare the update payload
  const updatePayload: any = {};
  
  if (payload.category === "tyre") {
    updatePayload.tyres = {
      [payload.type]: [{ name: payload.value }]
    };
  } else {
    updatePayload.wheels = {
      [payload.type]: [{ name: payload.value }]
    };
  }
  
  // Update the master filter with the new measurement
  const response = await patchMethod<MasterFilterApiResponse, typeof updatePayload>(
    `/api/v1/masterFilter/${masterFilter._id}`,
    updatePayload
  );
  
  return response.data;
};

// Update master filter (add new options)
export const updateMasterFilter = async (
  id: string,
  payload: Partial<{ tyres: Partial<TyreSpecifications>; wheels: Partial<WheelSpecifications> }>
): Promise<MasterFilterApiResponse> => {
  const response = await patchMethod<MasterFilterApiResponse, typeof payload>(
    `/api/v1/masterFilter/${id}`,
    payload
  );
  return response.data;
};

// Delete a specific option from master filter
export const deleteMasterFilterOption = async (
  id: string,
  category: "tyres" | "wheels",
  field: string,
  optionId: string
): Promise<MasterFilterApiResponse> => {
  const response = await deleteMethod<MasterFilterApiResponse>(`/api/v1/masterFilter/${id}`, {
    data: { category, field, optionId }
  });
  return response.data;
};