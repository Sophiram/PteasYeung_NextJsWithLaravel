// schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  password_confirmation: z
    .string()
    .min(1, 'Please confirm your password'),
  role: z.enum(['tenant', 'owner'], {
    message: 'Please select a role',
  }),
  phone: z.string().max(20).optional().or(z.literal('')),
  id_card_number: z.string().max(50).optional().or(z.literal('')),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
  id_card_number: z.string().max(50).optional().or(z.literal('')),
});

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  new_password_confirmation: z.string().min(1, 'Please confirm new password'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "New passwords don't match",
  path: ['new_password_confirmation'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
