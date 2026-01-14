import { axiosInstance } from "@/config/config";

export const welcomeService = {
  // Get all listings (public endpoint - no authentication required)
  getAllListings: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.filter) queryParams.append("filter", params.filter);

      const url = `/ev/listings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      
      // Use public axios instance (no auth required)
      const response = await axiosInstance.get(url);
      // Backend's handleResult unwraps the response, so return data directly
      return response.data;
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      // Return empty result instead of throwing to prevent page crash
      return { listings: [], total: 0, page: 1, limit: params?.limit || 10, totalPages: 0 };
    }
  },

  // Get featured listings (first few listings) - public endpoint
  getFeaturedListings: async (limit: number = 3) => {
    try {
      const url = `/ev/listings?limit=${limit}&page=1`;
      
      // Use public axios instance (no auth required)
      const response = await axiosInstance.get(url);
      // Backend's handleResult unwraps the response, so return data directly
      return response.data;
    } catch (error: any) {
      console.error("Error fetching featured listings:", error);
      // Return empty result instead of throwing to prevent page crash
      return { listings: [], total: 0, page: 1, limit, totalPages: 0 };
    }
  },

  // Get active repair locations (public endpoint - no authentication required)
  getActiveRepairLocations: async () => {
    try {
      const url = `/repair-location/active`;
      
      // Use public axios instance (no auth required)
      const response = await axiosInstance.get(url);
      // Backend's handleResult unwraps the response, so return data directly
      return response.data;
    } catch (error: any) {
      console.error("Error fetching repair locations:", error);
      // Return empty result instead of throwing to prevent page crash
      return [];
    }
  },

  // Submit contact message (public endpoint - no authentication required)
  submitContactMessage: async (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => {
    try {
      const url = `/contact-message`;
      
      // Use public axios instance (no auth required)
      const response = await axiosInstance.post(url, data);
      // Backend's handleResult unwraps the response, so return data directly
      return response.data;
    } catch (error: any) {
      console.error("Error submitting contact message:", error);
      throw error;
    }
  },
};

