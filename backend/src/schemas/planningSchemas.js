const { z } = require('zod');

const isoDateString = z
  .string()
  .regex(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
    'Date must be formatted as YYYY-MM-DD'
  );

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const projectedExpenseStatus = z.enum([
  'planned',
  'committed',
  'paid',
  'cancelled',
]);

const savingsGoalStatus = z.enum(['active', 'completed', 'abandoned']);

const contributionSource = z.enum(['manual', 'transfer', 'automation']);

const projectedExpensePayload = z.object({
  userId: z.string().uuid().optional(),
  creditCardId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  amountCents: z.coerce.number().int().positive(),
  category: z.string().trim().min(1).max(120),
  expectedDate: isoDateString,
  notes: z.string().trim().max(500).optional(),
});

const listProjectedExpensesSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),
      status: projectedExpenseStatus.optional(),
      statuses: z.array(projectedExpenseStatus).optional(),
    })
    .default({}),
});

const listProjectedExpenseTemplatesSchema = z.object({
  query: z.object({}).default({}),
});

const getProjectedExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const createProjectedExpenseSchema = z.object({
  body: projectedExpensePayload,
});

const updateProjectedExpenseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: projectedExpensePayload.partial().superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided',
      });
    }
  }),
});

const commitProjectedExpenseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const markProjectedExpensePaidSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      transactionId: z.string().uuid().nullable().optional(),
    })
    .default({}),
});

const createProjectedExpenseFromTemplateSchema = z.object({
  params: z.object({ templateId: z.string().min(1) }),
  body: z
    .object({
      userId: z.string().uuid().optional(),
      expectedDate: isoDateString.optional(),
      referenceDate: isoDateString.optional(),
      amountCents: z.coerce.number().int().positive().optional(),
      category: z.string().trim().min(1).max(120).optional(),
      notes: z.string().trim().max(500).optional(),
      creditCardId: z.string().uuid().optional(),
    })
    .default({}),
});

const cancelProjectedExpenseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      reason: z.string().trim().max(500).optional(),
    })
    .default({}),
});

const deleteProjectedExpenseSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const savingsGoalPayload = z.object({
  ownerUserId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(150),
  targetAmountCents: z.coerce.number().int().positive(),
  startDate: isoDateString,
  targetDate: isoDateString.optional(),
  status: savingsGoalStatus.optional(),
  category: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

const listSavingsGoalsSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),
      status: savingsGoalStatus.optional(),
      statuses: z.array(savingsGoalStatus).optional(),
    })
    .default({}),
});

const getSavingsGoalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const createSavingsGoalSchema = z.object({
  body: savingsGoalPayload.omit({ status: true }),
});

const updateSavingsGoalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: savingsGoalPayload
    .omit({ ownerUserId: true, status: true })
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

const completeSavingsGoalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const abandonSavingsGoalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      reason: z.string().trim().max(500).optional(),
    })
    .default({}),
});

const addContributionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    userId: z.string().uuid().optional(),
    amountCents: z.coerce.number().int().positive(),
    source: contributionSource.optional(),
    contributionDate: isoDateString,
    notes: z.string().trim().max(500).optional(),
  }),
});

const deleteContributionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    contributionId: z.string().uuid(),
  }),
});

const listContributionsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const categoryBudgetPayload = z.object({
  userId: z.string().uuid().optional(),
  category: z.string().trim().min(1).max(120),
  period: z.enum(['monthly', 'cycle']).optional(),
  limitAmountCents: z.coerce.number().int().positive(),
  warningThreshold: z.coerce
    .number()
    .gte(0, 'Warning threshold must be at least 0')
    .lte(1, 'Warning threshold cannot exceed 1')
    .optional(),
  periodStartDate: isoDateString.optional(),
  periodEndDate: isoDateString.optional(),
  isActive: z.boolean().optional(),
});

const listCategoryBudgetsSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),
      includeInactive: booleanString.optional(),
    })
    .default({}),
});

const listCategoryBudgetSummariesSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),
      includeInactive: booleanString.optional(),
      referenceDate: isoDateString.optional(),
    })
    .default({}),
});

const createCategoryBudgetSchema = z.object({
  body: categoryBudgetPayload,
});

const updateCategoryBudgetSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: categoryBudgetPayload
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

const deleteCategoryBudgetSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

module.exports = {
  listProjectedExpensesSchema,
  listProjectedExpenseTemplatesSchema,
  getProjectedExpenseSchema,
  createProjectedExpenseSchema,
  createProjectedExpenseFromTemplateSchema,
  updateProjectedExpenseSchema,
  commitProjectedExpenseSchema,
  markProjectedExpensePaidSchema,
  cancelProjectedExpenseSchema,
  deleteProjectedExpenseSchema,
  listSavingsGoalsSchema,
  getSavingsGoalSchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  completeSavingsGoalSchema,
  abandonSavingsGoalSchema,
  addContributionSchema,
  deleteContributionSchema,
  listContributionsSchema,
  listCategoryBudgetsSchema,
  listCategoryBudgetSummariesSchema,
  createCategoryBudgetSchema,
  updateCategoryBudgetSchema,
  deleteCategoryBudgetSchema,
};
