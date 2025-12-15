export type UserRole = "user" | "seller" | "finance" | "admin";


export type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type User = {
  name: string;
  email: string;
  address: Address;
  phone: string;
  profile_image: string;
  date_of_birth: string;
};
/**
 * Defines the main structure for a user's profile.
 */
export type User_Profile = {
  name: string;
  email: string;
  phone: string;
  profile_image: string;
  date_of_birth: string;
  
  /** * The user's physical address, represented as a nested object.
   */
  address: Address;
  isPasswordNull: boolean;
};