import { z } from 'zod';
import type { JohnnyDecimalSystem } from '@/types/johnnyDecimal';

export const ItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Item name is required")
});

export const CategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required"),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  items: z.array(ItemSchema).optional()
});

export const AreaSchema = z.object({
  id: z.string().min(1, "Area ID is required"),
  name: z.string().min(1, "Area name is required"),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  categories: z.array(CategorySchema).default([])
});

export const SystemSchema = z.object({
  name: z.string().min(1, "System name is required").max(100, "System name must be under 100 characters"),
  areas: z.array(AreaSchema).max(20, "Maximum 20 areas allowed")
});

export const DomainsSchema = z.object({
  domains: z.array(SystemSchema).max(10, "Maximum 10 domains allowed")
});

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ValidationSuccess<T> {
  success: true;
  data: T;
  error?: never;
}

interface ValidationError {
  success: false;
  error: string;
  data?: never;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

export function validateSystem(data: unknown): ValidationResult<JohnnyDecimalSystem> {
  try {
    const validated = SystemSchema.parse(data);
    return { success: true, data: validated as JohnnyDecimalSystem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid format' };
    }
    return { success: false, error: 'Invalid format' };
  }
}

export function validateDomains(data: unknown): ValidationResult<JohnnyDecimalSystem[]> {
  try {
    const validated = DomainsSchema.parse(data);
    return { success: true, data: validated.domains as JohnnyDecimalSystem[] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid format' };
    }
    return { success: false, error: 'Invalid format' };
  }
}
