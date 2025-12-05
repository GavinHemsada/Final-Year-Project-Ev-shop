import type { Vehicle} from "@/types";

export interface CartItem {
  _id: string;
  listing_id: Vehicle;
  quantity: number;
}