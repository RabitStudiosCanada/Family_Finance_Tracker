const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const listUsersSchema = z.object({
  query: z
    .object({
      includeArchived: booleanString.optional(),
    })
    .default({}),
});

const userPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  roleId: z.coerce.number().int().positive(),
});

const createUserSchema = z.object({
  body: userPayloadSchema.extend({
    password: z.string().min(8).max(100),
  }),
});

const updateUserSchema = z.object({
  params: idParamSchema,
  body: userPayloadSchema.partial().superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one field must be provided' });
    }
  }),
});

const getUserSchema = z.object({
  params: idParamSchema,
});

const archiveUserSchema = z.object({
  params: idParamSchema,
});

const resetPasswordSchema = z.object({
  params: idParamSchema,
  body: z.object({
    password: z.string().min(8).max(100),
  }),
});

module.exports = {
  listUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserSchema,
  archiveUserSchema,
  resetPasswordSchema,
};
