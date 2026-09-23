// schemas/property.schema.ts
import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  location_map_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
