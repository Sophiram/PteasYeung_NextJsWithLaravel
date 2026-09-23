// types/property.ts

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  created_at?: string;
}

export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  location_map_link?: string | null;
  images?: PropertyImage[];
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  rooms_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePropertyRequest {
  title: string;
  description?: string;
  address?: string;
  city?: string;
  location_map_link?: string;
}

export type UpdatePropertyRequest = Partial<CreatePropertyRequest>;

export interface PropertyListResponse {
  data?: Property[];
  success?: boolean;
}
