const { z } = require('zod');

const isoDateString = z
  .string()
  .regex(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
    'Date must be formatted as YYYY-MM-DD'
  );

const listPaymentCyclesSchema = z.object({
  query: z
    .object({
      asOf: isoDateString.optional(),
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

const recordPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      paymentRecordedOn: isoDateString.optional(),
      clear: z.boolean().optional(),
      asOf: isoDateString.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.clear && data.paymentRecordedOn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot provide paymentRecordedOn when clearing a payment',
          path: ['paymentRecordedOn'],
        });
      }
    })
    .default({}),
});

module.exports = {
  listPaymentCyclesSchema,
  recordPaymentSchema,
};
