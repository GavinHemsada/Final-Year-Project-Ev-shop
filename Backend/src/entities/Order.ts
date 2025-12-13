import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus } from "../shared/enum/enum";

/**
 * Represents a customer's order in the database.
 * An order is created when a user decides to purchase items from their cart.
 */
export interface IOrder extends Document {
  /** The unique identifier for the order document. */
  _id: Types.ObjectId;
  /** The ID of the `User` who placed the order. */
  user_id: Types.ObjectId;
  /** The ID of the `VehicleListing` being purchased. This is optional. */
  listing_id?: Types.ObjectId;
  /** The ID of the `Seller` who is fulfilling the order. */
  seller_id: Types.ObjectId;
  /** The ID of a `TestDriveBooking` associated with this order. This is optional. */
  booking_id?: Types.ObjectId;
  /** The current status of the order (e.g., "Pending", "Confirmed", "Cancelled"). */
  order_status: OrderStatus;
  /** The current payment status of the order (e.g., "Confirmed", "Failed"). */
  payment_status: string;
  /** The total monetary amount for the order. */
  total_amount: number;
  /** The date the order was placed. */
  order_date: Date;
}

/**
 * Mongoose schema for the Order collection.
 */
const OrderSchema = new Schema<IOrder>(
  {
    /** A reference to the `User` who placed the order. */
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** An optional reference to the `VehicleListing` being purchased. */
    listing_id: { type: Schema.Types.ObjectId, ref: "VehicleListing" },
    /** A reference to the `Seller` who will fulfill the order. */
    seller_id: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    /** An optional reference to a `TestDriveBooking` associated with the order. */
    booking_id: { type: Schema.Types.ObjectId, ref: "TestDriveBooking" },
    /** The current status of the order, controlled by the `OrderStatus` enum. */
    order_status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    /** The current payment status. */
    payment_status: { type: String, required: true },
    /** The total amount of the order, which is required. */
    total_amount: { type: Number, required: true },
    /** The date the order was placed, which is required. */
    order_date: { type: Date, required: true },
  },
  { timestamps: true }
);

/**
 * Creates indexes on key fields to optimize common query performance.
 * - `user_id`: To quickly find all orders for a specific user.
 * - `listing_id`: To find orders related to a specific vehicle listing.
 * - `seller_id`: To find all orders for a specific seller.
 * - `booking_id`: To find orders related to a specific test drive booking.
 * - `order_status`: To efficiently filter orders by their status.
 * - `payment_status`: To efficiently filter orders by their payment status.
 * - `order_date`: To sort orders chronologically.
 */
OrderSchema.index({ user_id: 1 });
OrderSchema.index({ listing_id: 1 });
OrderSchema.index({ seller_id: 1 });
OrderSchema.index({ booking_id: 1 });
OrderSchema.index({ order_status: 1 });
OrderSchema.index({ payment_status: 1 });
OrderSchema.index({ order_date: -1 });

/**
 * The Mongoose model for the Order collection.
 */
export default model<IOrder>("Order", OrderSchema);
