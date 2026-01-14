export const BuyerActiveTabes = {
  Dashboard: "dashboard",
  Orders: "orders",
  Profile: "profile",
  Saved: "saved",
  Services: "services",
  Notification: "notification",
  Cart: "cart",
  TestDrives: "testDrives",
  Reviews: "reviews",
  Financing: "financing",
  Community: "community",
  HelpCenter: "helpCenter",
} as const;

export type BuyerActiveTabes =
  (typeof BuyerActiveTabes)[keyof typeof BuyerActiveTabes];

export type ActiveTab =
  | "dashboard"
  | "orders"
  | "profile"
  | "saved"
  | "services"
  | "notification"
  | "cart"
  | "testDrives"
  | "reviews"
  | "financing"
  | "community"
  | "helpCenter";

export const SellerActiveTabs = {
  Dashbord: "dashboard",
  Orders: "orders",
  Profile: "profile",
  EvList: "evList",
  Saved: "saved",
  Reviews: "reviews",
  Community: "community",
  TestDrives: "testDrives",
  Notification: "notification",
  RepairLocations: "repairLocations",
  HelpCenter: "helpCenter",
} as const;

export type SellerActiveTabs =
  (typeof SellerActiveTabs)[keyof typeof SellerActiveTabs];

export type SellerActiveTab =
  | "dashboard"
  | "orders"
  | "profile"
  | "evList"
  | "editEvlist"
  | "saved"
  | "reviews"
  | "community"
  | "testDrives"
  | "notification"
  | "repairLocations"
  | "helpCenter";

export const FinancialActiveTabs = {
  Dashboard: "dashboard",
  Applications: "applications",
  Products: "products",
  Profile: "profile",
  Notification: "notification",
  Community: "community",
  HelpCenter: "helpCenter",
} as const;

export type FinancialActiveTabs =
  (typeof FinancialActiveTabs)[keyof typeof FinancialActiveTabs];

export type FinancialActiveTab =
  | "dashboard"
  | "applications"
  | "products"
  | "profile"
  | "notification"
  | "community"
  | "helpCenter";

export const AdminActiveTabs = {
  Dashboard: "dashboard",
  Users: "users",
  Orders: "orders",
  EVListings: "evListings",
  Sellers: "sellers",
  Financial: "financial",
  Reviews: "reviews",
  Payments: "payments",
  Community: "community",
} as const;

export type AdminActiveTabs =
  (typeof AdminActiveTabs)[keyof typeof AdminActiveTabs];

export type AdminActiveTab =
  | "dashboard"
  | "users"
  | "orders"
  | "evListings"
  | "sellers"
  | "financial"
  | "reviews"
  | "payments"
  | "community"
  | "complaints"
  | "testDrives"
  | "mlPipeline";
