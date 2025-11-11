const { z } = require('zod');

const isoDate = z
  .string()
  .regex(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
    'Date must be formatted as YYYY-MM-DD'
  );

const listSnapshotsSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),
      limit: z.coerce.number().int().positive().max(90).optional(),
    })
    .default({}),
});

const getSnapshotSchema = z.object({
  params: z.object({
    date: isoDate,
  }),
  query: z
    .object({
      userId: z.string().uuid().optional(),
    })
    .default({}),
});

const recalculateSnapshotSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid().optional(),
      calculatedFor: isoDate.optional(),
      notes: z.string().trim().max(500).optional(),
    })
    .default({}),
});

module.exports = {
  listSnapshotsSchema,
  getSnapshotSchema,
  recalculateSnapshotSchema,
};
