// schemas/invoice.schema.ts
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  booking_id: z.number({ message: 'Booking is required' }).int().positive(),
  electricity_start_unit: z.number().min(0).optional(),
  electricity_end_unit: z.number().min(0).optional(),
  water_unit: z.number().min(0).optional(),
  total_amount: z.number({ message: 'Total amount is required' }).min(0),
  payment_status: z.enum(['paid', 'unpaid', 'partial']).optional(),
  due_date: z.string().min(1, 'Due date is required'),
});

export const updateInvoiceSchema = createInvoiceSchema.omit({ booking_id: true }).partial();

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
