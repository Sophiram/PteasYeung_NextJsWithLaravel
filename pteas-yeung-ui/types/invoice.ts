// types/invoice.ts

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface Invoice {
  id: number;
  booking_id: number;
  electricity_start_unit: number;
  electricity_end_unit: number;
  water_unit: number;
  total_amount: string | number;
  payment_status: PaymentStatus;
  due_date: string;
  booking?: import('./booking').Booking;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceStats {
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  stats: InvoiceStats;
}

export interface CreateInvoiceRequest {
  booking_id: number;
  electricity_start_unit?: number;
  electricity_end_unit?: number;
  water_unit?: number;
  total_amount: number;
  payment_status?: PaymentStatus;
  due_date: string;
}

export type UpdateInvoiceRequest = Partial<Omit<CreateInvoiceRequest, 'booking_id'>>;
