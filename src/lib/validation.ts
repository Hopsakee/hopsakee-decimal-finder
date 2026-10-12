import { z } from 'zod';
import type { JohnnyDecimalSystem } from '@/types/johnnyDecimal';

// crypto.randomUUID only exists in secure contexts (https, localhost)
const newUid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `uid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const ItemSchema = z.object({
  id: z.string().min(1, "Item ID must not be empty; omit the key for notes without an HD id").optional(),
  name: z.string().min(1, "Item name is required")
}).transform(item => (item.id ? item : { ...item, uid: newUid() }));

/** Gives every id-less item without a uid one. Used where data skips the schema (localStorage, GitHub pull). */
export function withUids<T extends { areas?: { categories?: { items?: { id?: string; uid?: string }[] }[] }[] }>(systems: T[]): T[] {
  return systems.map(system => ({
    ...system,
    areas: (system.areas ?? []).map(area => ({
      ...area,
      categories: (area.categories ?? []).map(cat => cat.items
        ? { ...cat, items: cat.items.map(item => (item.id || item.uid ? item : { ...item, uid: newUid() })) }
        : cat)
    }))
  })) as T[];
}

/** JSON.stringify replacer for export and sync: drops the `uid` of id-less items. The browser's own localStorage keeps it. */
export const omitUid = (key: string, value: unknown) => (key === 'uid' ? undefined : value);

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
