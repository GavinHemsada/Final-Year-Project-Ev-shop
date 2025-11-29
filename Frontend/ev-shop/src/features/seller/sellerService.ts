import { axiosPrivate } from "@/config/config";

export const sellerService = {
  getSellerProfile: async (userId: string) => {
    const response = await axiosPrivate.get(`/seller/user/${userId}`);
    return response.data;
  },
  getSellerEvList: async (sellerId: string) => {
    const response = await axiosPrivate.get(`/ev/listings/seller/${sellerId}`);
    return response.data;
  },
  getListingForEdit: async (listingId: string) => {
    const response = await axiosPrivate.get(`/ev/listings/${listingId}`);
    // Backend's handleResult unwraps { success: true, listing: {...} } to just the listing object
    // So response.data is the listing directly
    return response.data;
  },
  getAllEvCateogry: async () => {
    const response = await axiosPrivate.get("/ev/categories");
    return response.data;
  },
  getAllEvBrand: async () => {
    const response = await axiosPrivate.get("/ev/brands");
    return response.data;
  },
  createnewModel: async (modelData: any) => {
    const response = await axiosPrivate.post("/ev/models", modelData);
    return response.data;
  },
  updateModel: async (modelId: string, modelData: any) => {
    const response = await axiosPrivate.put(`/ev/models/${modelId}`, modelData);
    return response.data;
  },
  createListing: async (listingData: any) => {
    const response = await axiosPrivate.post("/ev/listings", listingData);
    return response.data;
  },
  updateListing: async (listingId: string, listingData: any) => {
    const response = await axiosPrivate.put(
      `/ev/listings/${listingId}`,
      listingData
    );
    return response.data;
  },
  deleteListing: async (id: string) => {
    const response = await axiosPrivate.delete(`/ev/listings/${id}`);
    return response.data;
  },
  deleteModel: async (id: string) => {
    const response = await axiosPrivate.delete(`/ev/models/${id}`);
    return response.data;
  },

  // test drive slot operations
  getTestDriveSlotsBySeller: async (sellerId: string) => {
    const response = await axiosPrivate.get(
      `/test-drive/slots/seller/${sellerId}`
    );
    return response.data;
  },
  createTestDriveSlot: async (slotData: any) => {
    const response = await axiosPrivate.post(`/test-drive/slots`, slotData);
    return response.data;
  },
  updateTestDriveSlot: async (slotId: string, slotData: any) => {
    const response = await axiosPrivate.put(
      `/test-drive/slots/${slotId}`,
      slotData
    );
    return response.data;
  },
  deleteTestDriveSlot: async (slotId: string) => {
    const response = await axiosPrivate.delete(`/test-drive/slots/${slotId}`);
    return response.data;
  },
  getAllEvModels: async () => {
    const response = await axiosPrivate.get("/ev/models");
    return response.data;
  },
  updateSellerProfile: async (
    sellerId: string,
    profileData: FormData | any
  ) => {
    const response = await axiosPrivate.put(
      `/seller/${sellerId}`,
      profileData,
      {
        headers: {
          "Content-Type":
            profileData instanceof FormData
              ? "multipart/form-data"
              : "application/json",
        },
      }
    );
    return response.data;
  },
  // Repair location operations
  getRepairLocations: async (sellerId: string) => {
    const response = await axiosPrivate.get(
      `/repair-location/seller/${sellerId}`
    );
    return response.data;
  },
  createRepairLocation: async (locationData: any) => {
    const response = await axiosPrivate.post(`/repair-location`, locationData);
    return response.data;
  },
  updateRepairLocation: async (locationId: string, locationData: any) => {
    const response = await axiosPrivate.put(
      `/repair-location/${locationId}`,
      locationData
    );
    return response.data;
  },
  deleteRepairLocation: async (locationId: string) => {
    const response = await axiosPrivate.delete(
      `/repair-location/${locationId}`
    );
    return response.data;
  },
  // Order operations
  getSellerOrders: async (sellerId: string) => {
    const response = await axiosPrivate.get(`/order/seller/${sellerId}`);
    return response.data;
  },
};
