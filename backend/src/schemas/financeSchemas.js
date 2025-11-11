const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const creditCardPayload = z.object({
  userId: z.string().uuid().optional(),
  nickname: z.string().trim().min(1).max(120),
  issuer: z.string().trim().max(120).optional(),
  lastFour: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/u, 'Last four digits must be four numbers')
    .optional(),
  creditLimitCents: z.coerce.number().int().positive(),
  cycleAnchorDay: z.coerce.number().int().min(1).max(31),
  statementDay: z.coerce.number().int().min(1).max(31),
  paymentDueDay: z.coerce.number().int().min(1).max(31),
  autopayEnabled: z.boolean().optional(),
  openedAt: z.string().datetime({ offset: true }).optional(),
  closedAt: z.string().datetime({ offset: true }).optional(),
});

const listCreditCardsSchema = z.object({
  query: z
    .object({
      includeInactive: booleanString.optional(),
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

const createCreditCardSchema = z.object({
  body: creditCardPayload,
});

const updateCreditCardSchema = z.object({
  params: idParamSchema,
  body: creditCardPayload
    .omit({ userId: true })
    .partial()
    .superRefine((data, ctx) => {
      if (Object.keys(data).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one field must be provided',
        });
      }
    }),
});

const getCreditCardSchema = z.object({
  params: idParamSchema,
});

const archiveCreditCardSchema = z.object({
  params: idParamSchema,
});

const incomeStreamPayload = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  amountCents: z.coerce.number().int().positive(),
  frequency: z.enum([
    'weekly',
    'biweekly',
    'semimonthly',
    'monthly',
    'quarterly',
    'annually',
  ]),
  nextExpectedDate: z
    .string()
    .regex(
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
      'Date must be formatted as YYYY-MM-DD'
    )
    .optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});

const listIncomeStreamsSchema = z.object({
  query: z
    .object({
      includeInactive: booleanString.optional(),
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

const createIncomeStreamSchema = z.object({
  body: incomeStreamPayload,
});

const updateIncomeStreamSchema = z.object({
  params: idParamSchema,
  body: incomeStreamPayload
    .omit({ userId: true })
    .partial()
    .superRefine((data, ctx) => {
      if (Object.keys(data).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one field must be provided',
        });
      }
    }),
});

const getIncomeStreamSchema = z.object({
  params: idParamSchema,
});

const archiveIncomeStreamSchema = z.object({
  params: idParamSchema,
});

const transactionPayload = z.object({
  userId: z.string().uuid().optional(),
  creditCardId: z.string().uuid().optional(),
  incomeStreamId: z.string().uuid().optional(),
  cardCycleId: z.string().uuid().optional(),
  type: z.enum(['expense', 'income', 'payment', 'transfer']),
  amountCents: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, { message: 'Amount must not be zero' }),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a three character ISO code')
    .transform((value) => value.toUpperCase())
    .optional(),
  category: z.string().trim().min(1).max(120),
  transactionDate: z
    .string()
    .regex(
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
      'Date must be formatted as YYYY-MM-DD'
    ),
  isPending: z.boolean().optional(),
  merchant: z.string().trim().max(120).optional(),
  memo: z.string().trim().max(500).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

const listTransactionsSchema = z.object({
  query: z
    .object({
      type: z.enum(['expense', 'income', 'payment', 'transfer']).optional(),
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

const createTransactionSchema = z.object({
  body: transactionPayload,
});

const updateTransactionSchema = z.object({
  params: idParamSchema,
  body: transactionPayload
    .omit({ userId: true })
    .partial()
    .superRefine((data, ctx) => {
      if (Object.keys(data).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one field must be provided',
        });
      }
    }),
});

const getTransactionSchema = z.object({
  params: idParamSchema,
});

const deleteTransactionSchema = z.object({
  params: idParamSchema,
});

module.exports = {
  listCreditCardsSchema,
  createCreditCardSchema,
  updateCreditCardSchema,
  getCreditCardSchema,
  archiveCreditCardSchema,
  listIncomeStreamsSchema,
  createIncomeStreamSchema,
  updateIncomeStreamSchema,
  getIncomeStreamSchema,
  archiveIncomeStreamSchema,
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionSchema,
  deleteTransactionSchema,
};
