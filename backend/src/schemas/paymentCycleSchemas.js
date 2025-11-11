const { z } = require('zod');

const listPaymentCyclesSchema = z.object({
  query: z
    .object({
      asOf: z
        .string()
        .regex(
          /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
          'Date must be formatted as YYYY-MM-DD'
        )
        .optional(),
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

module.exports = {
  listPaymentCyclesSchema,
};
