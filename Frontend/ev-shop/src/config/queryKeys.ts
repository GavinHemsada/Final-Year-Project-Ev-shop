export const queryKeys = {
  // buyer
  userProfile: (id: string) => ["userProfile", id],
  notifications: (userID: string) => ["notification", userID],
  cart: (id: string) => ["cart", id],
  orders: (id: string) => ["orders", id],
  evlist: ["evlist"],
  testDrive: (id: string) => ["testDrive", id],
  activeTestDriveSlots: ["activeTestDriveSlots"],
  customerTestDrives: (id: string) => ["customerTestDrives", id],
  checkPassword: (email: string) => ["checkPassword", email],

  communityPosts: (search?: string) => ["communityPosts", search || ""],
  communityPost: (id: string) => ["communityPost", id],
  myPosts: (userId: string) => ["myPosts", userId],

  savedVehicles: (userId: string) => ["savedVehicles", userId],
  isVehicleSaved: (userId: string, listingId: string) => [
    "isVehicleSaved",
    userId,
    listingId,
  ],

  vehicleById: (id: string) => ["vehicle", id],
  postReplies: (postId: string) => ["postReplies", postId],
  // seller
  sellerProfile: (id: string) => ["sellerProfile", id],
  sellerOrders: (id: string) => ["sellerOrders", id],
  sellerEvlist: (id: string) => ["sellerEvlist", id],
  sellerTestDrive: (id: string) => ["sellerTestDrive", id],
  listingForEdit: (listingId: string) => ["listingForEdit", listingId],
  repairLocations: (sellerId: string) => ["repairLocations", sellerId],
  activeRepairLocations: ["activeRepairLocations"],
  testDriveSlots: (sellerId: string) => ["testDriveSlots", sellerId],
  evModels: ["evModels"],
  evCategories: ["evCategories"],
  evBrands: ["evBrands"],
  // financial
  financialInstitution: (userId: string) => ["financialInstitution", userId],
  financialProducts: (institutionId: string) => [
    "financialProducts",
    institutionId,
  ],
  financialApplications: (institutionId: string) => [
    "financialApplications",
    institutionId,
  ],
};
