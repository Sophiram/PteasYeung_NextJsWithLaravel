// types/booking.ts

export type BookingStatus = 'pending' | 'active' | 'cancelled' | 'ended' | 'completed';

export interface Booking {
  id: number;
  room_id: number;
  tenant_id: number;
  owner_id: number;
  check_in_date: string;
  check_out_date?: string | null;
  deposit_amount: string | number;
  status: BookingStatus;
  room?: import('./room').Room;
  tenant?: import('./auth').User;
  owner?: import('./auth').User;
  invoices?: import('./invoice').Invoice[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateBookingRequest {
  room_id: number;
  tenant_id: number;
  check_in_date: string;
  check_out_date?: string;
  deposit_amount: number;
}

export type UpdateBookingRequest = Partial<CreateBookingRequest>;

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}

export interface BookingListResponse {
  data?: Booking[];
  success?: boolean;
}
