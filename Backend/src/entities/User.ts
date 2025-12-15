import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole } from "../shared/enum/enum";

/**
 * Represents the structure for a One-Time Password (OTP) used for password resets.
 * This is embedded within the `IUser` document.
 */
interface ResetOtp {
  /** The SHA256 hash of the OTP. */
  otpHash: string;
  /** The timestamp when the OTP will expire. */
  expiresAt: Date;
  /** The number of incorrect verification attempts. */
  attempts: number;
}

/**
 * Represents a user document in the database.
 */
export interface IUser extends Document {
  /** The unique identifier for the user document. */
  _id: Types.ObjectId;
  /** The user's email address, used for login and communication. */
  email: string;
  /** The user's hashed password. This field is optional to support OAuth-only users. */
  password: string;
  /** An array of roles assigned to the user (e.g., 'user', 'admin', 'seller'). */
  role: UserRole[];
  /** The user's full name. This field is optional. */
  name: string;
  /** The file path or URL to the user's profile image. This field is optional. */
  profile_image?: string;
  /** The user's date of birth. This field is optional. */
  date_of_birth?: Date;
  /** A nested object containing the user's address details. This field is optional. */
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  /** The user's phone number. This field is optional. */
  phone: string;
  /** The timestamp of the user's last login. This field is optional. */
  last_login?: Date;
  /** An embedded object containing OTP details for password reset. This field is optional. */
  resetOtp?: ResetOtp;
  /**
   * An instance method to compare a plain-text password with the user's hashed password.
   * @param raw - The plain-text password to compare.
   * @returns A promise that resolves to `true` if the passwords match, otherwise `false`.
   */
  comparePassword(raw: string): Promise<boolean>;
}

/**
 * Mongoose schema for the embedded ResetOtp object.
 * Note: `_id: false` prevents Mongoose from creating a separate `_id` for this sub-document.
 */
const ResetOtpSchema = new Schema<ResetOtp>(
  {
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Mongoose schema for the User collection.
 */
const UserSchema = new Schema<IUser>(
  {
    /** The user's email must be a unique, required string. */
    email: { type: String, required: true, unique: true },
    /** The user's password. It is not required, allowing for users who sign up via OAuth. */
    password: { type: String },
    /**
     * An array of roles assigned to the user.
     * - It is controlled by the `UserRole` enum.
     * - It has a custom validator to ensure a user has between 1 and 2 roles.
     * - It defaults to `[UserRole.USER]`.
     */
    role: {
      type: [String],
      enum: Object.values(UserRole),
      required: true,
      validate: [
        (val: string[]) => val.length > 0 && val.length <= 2,
        "User must have 1 or 2 roles only",
      ],
      default: [UserRole.USER],
    },
    /** The user's name. */
    name: { type: String },
    /** The path to the user's profile image. */
    profile_image: String,
    /** The user's date of birth. */
    date_of_birth: Date,
    /** A nested schema for the user's address. */
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    /** The user's phone number. */
    phone: { type: String },
    /** The embedded schema for password reset OTPs. */
    resetOtp: ResetOtpSchema,
    /** The timestamp of the last login. */
    last_login: Date,
  },
  {
    timestamps: true,
    /**
     * A transform function for converting the document to JSON.
     * This is a security measure to ensure sensitive data (like the password hash)
     * is not included in API responses.
     */
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        delete ret.password;
        delete ret.salt;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    /**
     * A transform function for converting the document to a plain object.
     * This mirrors the `toJSON` transform for consistency.
     */
    toObject: {
      virtuals: true,
      transform(_doc, ret: any) {
        delete ret.password;
        delete ret.salt;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
  }
);

/**
 * A pre-save middleware hook that automatically hashes the user's password
 * before saving it to the database, but only if the password has been modified.
 * This prevents re-hashing on every document update.
 */
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Defines an instance method `comparePassword` on the User schema.
 * This provides a convenient and secure way to check if a provided password
 * matches the stored hash.
 */
UserSchema.methods.comparePassword = function (raw: string) {
  return bcrypt.compare(raw, this.password);
};

/** A virtual property `isPasswordNull` to check if the user's password is null.
 * This is useful for determining if the user signed up via OAuth and has no password set.
 */
UserSchema.virtual("isPasswordNull").get(function (this: IUser) {
  return this.password == null;
});
/**
 * Creates indexes on key fields to optimize common query performance.
 * - `role` and `last_login`: For querying users by role, sorted by last login.
 * - `email`: Ensures fast lookups by email, which is critical for login.
 * - `resetOtp.expiresAt`: A TTL (Time-To-Live) index that automatically removes documents
 *   from the collection after the specified time (`expiresAt`) has passed. This is used
 *   to automatically clean up expired OTP data.
 */
UserSchema.index({ role: 1, last_login: -1 });
UserSchema.index({ email: 1 });
UserSchema.index({ "resetOtp.expiresAt": 1 }, { expireAfterSeconds: 0 });

/**
 * The Mongoose model for the User collection.
 */
export const User = model<IUser>("User", UserSchema);
