export interface RepairLocation {
  _id: string;
  seller_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  operating_hours?: string;
  description?: string;
  is_active: boolean;
}

export type RepairLocationFormData = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  operating_hours?: string;
  description?: string;
  is_active: boolean;
};