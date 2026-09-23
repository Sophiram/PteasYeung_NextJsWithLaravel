// schemas/booking.schema.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
  room_id: z.number({ message: 'Room is required' }).int().positive(),
  tenant_id: z.number({ message: 'Tenant is required' }).int().positive(),
  check_in_date: z.string().min(1, 'Check-in date is required'),
  check_out_date: z.string().optional().or(z.literal('')),
  deposit_amount: z.number({ message: 'Deposit amount is required' }).min(0),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'cancelled', 'ended', 'completed'], {
    message: 'Status is required',
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
