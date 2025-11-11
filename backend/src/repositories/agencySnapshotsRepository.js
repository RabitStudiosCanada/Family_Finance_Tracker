const db = require('../db/knex').connection;

const TABLE_NAME = 'agency_snapshots';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'agency_snapshots.id',
    'agency_snapshots.user_id',
    'agency_snapshots.calculated_for',
    'agency_snapshots.credit_agency_cents',
    'agency_snapshots.backed_agency_cents',
    'agency_snapshots.available_credit_cents',
    'agency_snapshots.projected_obligations_cents',
    'agency_snapshots.projected_expense_total_cents',
    'agency_snapshots.savings_commitments_cents',
    'agency_snapshots.safe_to_spend_cents',
    'agency_snapshots.calculated_at',
    'agency_snapshots.notes',
    'agency_snapshots.created_at',
    'agency_snapshots.updated_at'
  );

const findByUserId = ({ userId, limit = 25 }) =>
  baseQuery()
    .where('agency_snapshots.user_id', userId)
    .orderBy('agency_snapshots.calculated_for', 'desc')
    .limit(limit);

const findByUserIdAndDate = (userId, calculatedFor) =>
  baseQuery()
    .where({
      user_id: userId,
      calculated_for: calculatedFor,
    })
    .first();

const findLatestByUserId = (userId) =>
  baseQuery()
    .where('agency_snapshots.user_id', userId)
    .orderBy('agency_snapshots.calculated_for', 'desc')
    .first();

const upsertSnapshot = async (snapshot) => {
  const existing = await findByUserIdAndDate(
    snapshot.user_id,
    snapshot.calculated_for
  );

  if (existing) {
    await db(TABLE_NAME)
      .where({ id: existing.id })
      .update({
        credit_agency_cents: snapshot.credit_agency_cents,
        backed_agency_cents: snapshot.backed_agency_cents,
        available_credit_cents: snapshot.available_credit_cents,
        projected_obligations_cents: snapshot.projected_obligations_cents,
        projected_expense_total_cents: snapshot.projected_expense_total_cents,
        savings_commitments_cents: snapshot.savings_commitments_cents,
        safe_to_spend_cents: snapshot.safe_to_spend_cents,
        calculated_at: snapshot.calculated_at,
        notes: snapshot.notes ?? null,
        updated_at: db.fn.now(),
      });

    return findByUserIdAndDate(snapshot.user_id, snapshot.calculated_for);
  }

  await db(TABLE_NAME).insert({
    ...snapshot,
    notes: snapshot.notes ?? null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findByUserIdAndDate(snapshot.user_id, snapshot.calculated_for);
};

module.exports = {
  findByUserId,
  findByUserIdAndDate,
  findLatestByUserId,
  upsertSnapshot,
};
