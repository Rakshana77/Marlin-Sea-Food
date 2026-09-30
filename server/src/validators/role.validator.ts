import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().trim().max(255).optional().nullable(),
  permissionIds: z.array(z.string().uuid()).optional()
});

export const updateRoleSchema = createRoleSchema.partial();
