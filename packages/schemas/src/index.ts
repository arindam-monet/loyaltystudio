import { z } from 'zod';

// Basic schemas for the application
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  tenantId: z.string().optional(),
  roleId: z.string().optional(),
});

export const merchantSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  subdomain: z.string(),
  tenantId: z.string(),
});

export const loyaltyProgramSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  merchantId: z.string(),
  isActive: z.boolean().default(true),
});

// Export all schemas
export default {
  userSchema,
  merchantSchema,
  loyaltyProgramSchema,
};
