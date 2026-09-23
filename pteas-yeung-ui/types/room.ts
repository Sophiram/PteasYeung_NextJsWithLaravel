// types/room.ts

export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'available' | 'occupied' | 'maintenance' | string;
export type RoomType = 'Single' | 'Double' | 'Studio' | 'Apartment' | 'single' | 'double' | 'suite' | 'studio' | string;

export interface RoomImage {
  id: number;
  room_id?: number;
  image_url?: string;
  image_path?: string;
  created_at?: string;
}

export interface Room {
  id: number;
  property_id?: number;
  room_number: string;
  price: string | number;
  deposit?: string | number | null;
  type: RoomType;
  status: RoomStatus;
  floor?: string | null;
  amenities?: string[] | string | null;
  description?: string | null;
  image?: string | null;
  images?: RoomImage[];
  property?: {
    id?: number;
    title: string;
    address?: string;
    city?: string;
    location?: string;
    images?: RoomImage[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface RoomAvailability {
  room_id: number;
  is_available: boolean;
  status: RoomStatus;
}

export interface RoomListResponse {
  data?: Room[];
  success?: boolean;
}

export interface CreateRoomRequest {
  property_id: number;
  room_number: string;
  price: number;
  deposit?: number;
  type: string;
  status?: RoomStatus;
  floor?: string;
  amenities?: string[];
  description?: string;
}

export type UpdateRoomRequest = Partial<CreateRoomRequest>;
