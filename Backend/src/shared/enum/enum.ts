/**
 * Defines the roles a user can have within the system.
 */
export enum UserRole {
  /** The user has full administrative privileges. */
  ADMIN = "admin",
  /** A standard user with customer-level permissions. */
  USER = "user",
  /** A user who can list and sell vehicles. */
  SELLER = "seller",
  /** A user associated with a financial institution, managing loan products and applications. */
  FINANCE = "finance",
}

/**
 * Defines the types of notifications that can be sent to users.
 */
export enum NotificationType {
  /** Notification for a successfully placed order. */
  ORDER_CONFIRMED = "ORDER_CONFIRMED",
  /** Notification for a cancelled order. */
  ORDER_CANCELLED = "ORDER_CANCELLED",
  /** Notification for a confirmed test drive booking. */
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  /** Notification for a cancelled test drive booking. */
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  /** Notification for a new financing application submitted. */
  NEW_FINANCING_APPLICATION = "NEW_FINANCING_APPLICATION",
  /** Notification for an approved finance application. */
  APPLICATION_APPROVED = "APPLICATION_APPROVED",
  /** Notification for a rejected finance application. */
  APPLICATION_REJECTED = "APPLICATION_REJECTED",
  /** Notification for an approved seller application. */
  SELLER_APPLICATION_APPROVED = "SELLER_APPLICATION_APPROVED",
  /** Notification for a rejected seller application. */
  SELLER_APPLICATION_REJECTED = "SELLER_APPLICATION_REJECTED",
  /** Notification for a new reply to a user's post. */
  POST_REPLY = "POST_REPLY",
}

/**
 * Defines the supported payment card methods.
 */
export enum PaymentMethod {
  /** Visa card. */
  VISA = "visa",
  /** Mastercard. */
  MASTERCARD = "mastercard",
  /** American Express card. */
  AMERICAN_EXPRESS = "american_express",
}

/**
 * Defines the purpose of a payment transaction.
 */
export enum PaymentType {
  /** Payment for purchasing a vehicle. */
  EV_PURCHASE = "purchase",
  /** Payment for leasing a vehicle. */
  EV_LEASE = "lease",
  /** Payment or hold for a test drive booking. */
  EV_TEST_DRIVE = "test_drive",
}

/**
 * Defines the status of a payment transaction.
 */
export enum PaymentStatus {
  /** The payment has been successfully authorized and confirmed. */
  CONFIRMED = "confirmed",
  /** The payment transaction failed. */
  FAILED = "failed",
  /** The payment process is complete (e.g., funds captured). */
  COMPLETED = "completed",
  /** The payment was cancelled by the user or system. */
  CANCELLED = "cancelled",
}

/**
 * Defines the status of a customer's order.
 */
export enum OrderStatus {
  /** The order has been placed but not yet confirmed. */
  PENDING = "pending",
  /** The order has been confirmed by the seller. */
  CONFIRMED = "confirmed",
  /** The order has been completed and delivered. */
  COMPLETED = "completed",
  /** The order has been cancelled. */
  CANCELLED = "cancelled",
}

/**
 * Defines the status of a financing application.
 */
export enum ApplicationStatus {
  /** The application has been submitted and is awaiting review. */
  PENDING = "pending",
  /** The application has been approved. */
  APPROVED = "approved",
  /** The application has been rejected. */
  REJECTED = "rejected",
  /** The application is currently being reviewed by a loan officer. */
  UNDER_REVIEW = "under_review",
  /** The application process is complete (e.g., funds disbursed). */
  COMPLETED = "completed",
}

/**
 * Defines the type of entity that a review is for.
 */
export enum ReviewType {
  /** A review for a specific vehicle model or listing. */
  PRODUCT = "product",
  /** A review for a service, such as a seller or a test drive experience. */
  SERVICE = "service",
}

/**
 * Defines the condition of a listed vehicle.
 */
export enum VehicleCondition {
  /** The vehicle is brand new. */
  NEW = "new",
  /** The vehicle is pre-owned/used. */
  USED = "used",
}

/**
 * Defines the type of vehicle listing.
 */
export enum ListingType {
  /** The vehicle is available for purchase. */
  SALE = "sale",
  /** The vehicle is available for lease. */
  LEASE = "lease",
}

/**
 * Defines the status of a test drive booking.
 */
export enum TestDriveBookingStatus {
  /** The booking has been confirmed by the seller. */
  CONFIRMED = "confirmed",
  /** The booking has been cancelled by the user or seller. */
  CANCELLED = "cancelled",
  /** The test drive has been completed. */
  COMPLETED = "completed",
  /** The test drive has expired. */
  EXPIRED = "expired",
}

/**
 * Defines the status of a vehicle listing.
 */
export enum ListingStatus {
  /** The listing is currently active and visible to customers. */
  ACTIVE = "active",
  /** The listing is inactive and hidden from customers. */
  INACTIVE = "inactive",
  /** The vehicle in the listing has been sold. */
  SOLD = "sold",
}
