// schemas/room.schema.ts
import { z } from 'zod';

export const createRoomSchema = z.object({
  property_id: z.number({ message: 'Property is required' }).int().positive(),
  room_number: z.string().min(1, 'Room number is required').max(20),
  price: z.number({ message: 'Price is required' }).positive('Price must be positive'),
  deposit: z.number().min(0).optional(),
  type: z.string().min(1, 'Room type is required'),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  floor: z.string().max(10).optional().or(z.literal('')),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional().or(z.literal('')),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  property_id: z.number().int().positive().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
