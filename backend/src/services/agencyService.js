const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const agencySnapshotsRepository = require('../repositories/agencySnapshotsRepository');
const creditCardCyclesRepository = require('../repositories/creditCardCyclesRepository');
const creditCardsRepository = require('../repositories/creditCardsRepository');
const incomeStreamsRepository = require('../repositories/incomeStreamsRepository');
const transactionsRepository = require('../repositories/transactionsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeAgencySnapshot } = require('../utils/serializers');

const LOOKAHEAD_DAYS = 45;
const CREDIT_SAFETY_BUFFER_PERCENT = 0.05;

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const addDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const addInterval = (date, frequency) => {
  const next = new Date(date.getTime());

  switch (frequency) {
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'biweekly':
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case 'semimonthly':
      next.setUTCDate(next.getUTCDate() + 15);
      break;
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case 'quarterly':
      next.setUTCMonth(next.getUTCMonth() + 3);
      break;
    case 'annually':
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
    default:
      throw createError(400, `Unsupported income frequency: ${frequency}`);
  }

  return next;
};

const occurrencesWithinWindow = (stream, start, end) => {
  let nextOccurrence = toDate(stream.next_expected_date);

  if (!nextOccurrence) {
    return 0;
  }

  let guard = 0;
  while (nextOccurrence < start && guard < 500) {
    nextOccurrence = addInterval(nextOccurrence, stream.frequency);
    guard += 1;
  }

  if (!nextOccurrence || nextOccurrence > end) {
    return 0;
  }

  let count = 0;
  guard = 0;

  while (nextOccurrence && nextOccurrence <= end && guard < 500) {
    count += 1;
    nextOccurrence = addInterval(nextOccurrence, stream.frequency);
    guard += 1;
  }

  return count;
};

const amountPerOccurrence = (stream) => {
  switch (stream.frequency) {
    case 'semimonthly':
      return Math.round(stream.amount_cents / 2);
    default:
      return stream.amount_cents;
  }
};

const resolveTargetUserId = async (currentUser, requestedUserId) => {
  if (currentUser.role === 'admin') {
    if (!requestedUserId) {
      return currentUser.id;
    }

    const targetUser = await usersRepository.findById(requestedUserId, {
      includeInactive: true,
    });

    if (!targetUser) {
      throw createError(404, 'User not found');
    }

    return requestedUserId;
  }

  if (requestedUserId && requestedUserId !== currentUser.id) {
    throw createError(
      403,
      'You do not have permission to manage this resource'
    );
  }

  return currentUser.id;
};

const calculateSnapshotForUser = async (
  userId,
  calculatedFor,
  { notes } = {}
) => {
  const calculatedForDate = calculatedFor || toIsoDate(new Date());
  const startDate = toDate(calculatedForDate);

  if (!startDate) {
    throw createError(400, 'Unable to parse provided calculation date');
  }

  const endDate = addDays(startDate, LOOKAHEAD_DAYS);
  const endDateIso = toIsoDate(endDate);

  const [creditCards, incomeStreams] = await Promise.all([
    creditCardsRepository.findByUserId({ userId }),
    incomeStreamsRepository.findByUserId({ userId }),
  ]);

  const creditCardIds = creditCards.map((card) => card.id);

  const [openCycles, upcomingTransactions] = await Promise.all([
    creditCardCyclesRepository.findOpenByCreditCardIds(creditCardIds),
    transactionsRepository.findByUserIdWithinDateRange({
      userId,
      startDate: calculatedForDate,
      endDate: endDateIso,
    }),
  ]);

  const totalCreditLimitCents = creditCards.reduce(
    (sum, card) => sum + card.credit_limit_cents,
    0
  );
  const outstandingBalanceCents = openCycles.reduce(
    (sum, cycle) => sum + cycle.statement_balance_cents,
    0
  );
  const availableCreditCents = Math.max(
    totalCreditLimitCents - outstandingBalanceCents,
    0
  );

  const pendingExpensesCents = upcomingTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount_cents), 0);

  const minimumPaymentsCents = openCycles
    .filter((cycle) => {
      const dueDate = toDate(cycle.payment_due_date);
      return dueDate && dueDate >= startDate && dueDate <= endDate;
    })
    .reduce((sum, cycle) => sum + cycle.minimum_payment_cents, 0);

  const projectedObligationsCents = pendingExpensesCents + minimumPaymentsCents;

  const upcomingIncomeCents = incomeStreams.reduce((sum, stream) => {
    const occurrences = occurrencesWithinWindow(stream, startDate, endDate);
    const amount = amountPerOccurrence(stream);
    return sum + occurrences * amount;
  }, 0);

  const uncoveredObligationsCents = Math.max(
    projectedObligationsCents - upcomingIncomeCents,
    0
  );

  const bufferCents = Math.round(
    totalCreditLimitCents * CREDIT_SAFETY_BUFFER_PERCENT
  );

  const creditAgencyCents = Math.max(
    availableCreditCents - bufferCents - uncoveredObligationsCents,
    0
  );
  const backedAgencyCents = Math.max(
    upcomingIncomeCents - projectedObligationsCents,
    0
  );

  const snapshotRecord = {
    id: randomUUID(),
    user_id: userId,
    calculated_for: calculatedForDate,
    credit_agency_cents: creditAgencyCents,
    backed_agency_cents: backedAgencyCents,
    available_credit_cents: availableCreditCents,
    projected_obligations_cents: projectedObligationsCents,
    calculated_at: new Date().toISOString(),
    notes,
  };

  const savedSnapshot =
    await agencySnapshotsRepository.upsertSnapshot(snapshotRecord);

  return serializeAgencySnapshot(savedSnapshot);
};

const listSnapshots = async (currentUser, { userId, limit } = {}) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const snapshots = await agencySnapshotsRepository.findByUserId({
    userId: targetUserId,
    limit,
  });

  return snapshots.map(serializeAgencySnapshot);
};

const getSnapshotByDate = async (
  currentUser,
  calculatedFor,
  { userId } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const snapshot = await agencySnapshotsRepository.findByUserIdAndDate(
    targetUserId,
    calculatedFor
  );

  if (!snapshot) {
    throw createError(404, 'Agency snapshot not found');
  }

  return serializeAgencySnapshot(snapshot);
};

const recalculateSnapshot = async (currentUser, payload = {}) => {
  const targetUserId = await resolveTargetUserId(currentUser, payload.userId);

  return calculateSnapshotForUser(targetUserId, payload.calculatedFor, {
    notes: payload.notes,
  });
};

module.exports = {
  listSnapshots,
  getSnapshotByDate,
  recalculateSnapshot,
};
