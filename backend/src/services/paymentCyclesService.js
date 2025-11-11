const createError = require('http-errors');

const creditCardCyclesRepository = require('../repositories/creditCardCyclesRepository');
const creditCardsRepository = require('../repositories/creditCardsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializePaymentCycle } = require('../utils/serializers');

const MS_PER_DAY = 86_400_000;

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

const startOfDayUtc = (date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

const toIsoDate = (date) => date.toISOString().slice(0, 10);

const buildMonthlyDate = (year, month, day) => {
  const base = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
  ).getUTCDate();
  base.setUTCDate(Math.min(day, daysInMonth));
  return base;
};

const nextMonthlyOccurrence = (reference, dayOfMonth) => {
  let candidate = buildMonthlyDate(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    dayOfMonth
  );

  if (candidate < reference) {
    candidate = buildMonthlyDate(
      candidate.getUTCFullYear(),
      candidate.getUTCMonth() + 1,
      dayOfMonth
    );
  }

  return candidate;
};

const cycleStartForStatement = (statementDate, anchorDay) => {
  if (!statementDate) {
    return null;
  }

  const sameMonthStart = buildMonthlyDate(
    statementDate.getUTCFullYear(),
    statementDate.getUTCMonth(),
    anchorDay
  );

  if (anchorDay > statementDate.getUTCDate()) {
    return buildMonthlyDate(
      sameMonthStart.getUTCFullYear(),
      sameMonthStart.getUTCMonth() - 1,
      anchorDay
    );
  }

  return sameMonthStart;
};

const dueDateForStatement = (statementDate, dueDay) => {
  if (!statementDate) {
    return null;
  }

  let dueDate = buildMonthlyDate(
    statementDate.getUTCFullYear(),
    statementDate.getUTCMonth(),
    dueDay
  );

  if (dueDate <= statementDate) {
    dueDate = buildMonthlyDate(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth() + 1,
      dueDay
    );
  }

  return dueDate;
};

const diffInDays = (from, to) => {
  if (!from || !to) {
    return null;
  }

  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
};

const daysBetween = (from, to) => {
  if (!from || !to) {
    return null;
  }

  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
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

const listPaymentCycles = async (currentUser, { userId, asOf } = {}) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const asOfDate = asOf ? toDate(asOf) : startOfDayUtc(new Date());

  if (!asOfDate) {
    throw createError(400, 'Unable to parse provided reference date');
  }

  const normalizedAsOf = startOfDayUtc(asOfDate);

  const creditCards = await creditCardsRepository.findByUserId({
    userId: targetUserId,
    includeInactive: false,
  });

  if (!creditCards.length) {
    return [];
  }

  const openCycles = await creditCardCyclesRepository.findOpenByCreditCardIds(
    creditCards.map((card) => card.id)
  );

  const openCycleByCardId = new Map();
  openCycles.forEach((cycle) => {
    openCycleByCardId.set(cycle.credit_card_id, cycle);
  });

  const summaries = creditCards.map((card) => {
    const openCycle = openCycleByCardId.get(card.id) || null;
    const nextStatementDate = nextMonthlyOccurrence(
      normalizedAsOf,
      card.statement_day
    );
    const nextPaymentDueDate = dueDateForStatement(
      nextStatementDate,
      card.payment_due_day
    );
    const nextCycleStartDate = cycleStartForStatement(
      nextStatementDate,
      card.cycle_anchor_day
    );

    const currentDueDate = openCycle
      ? toDate(openCycle.payment_due_date)
      : null;
    const statementDate = openCycle ? toDate(openCycle.statement_date) : null;

    const recommendedPaymentCents = openCycle
      ? card.autopay_enabled
        ? openCycle.minimum_payment_cents
        : openCycle.statement_balance_cents
      : 0;

    const totalStatementBalanceCents = openCycle
      ? openCycle.statement_balance_cents
      : 0;

    return {
      creditCardId: card.id,
      creditCardNickname: card.nickname,
      creditCardIssuer: card.issuer,
      creditCardLastFour: card.last_four,
      autopayEnabled: Boolean(card.autopay_enabled),
      calculatedFor: toIsoDate(normalizedAsOf),
      recommendedPaymentCents,
      totalStatementBalanceCents,
      currentCycle: openCycle
        ? {
            id: openCycle.id,
            cycleNumber: openCycle.cycle_number,
            cycleStartDate: openCycle.cycle_start_date,
            statementDate: openCycle.statement_date,
            paymentDueDate: openCycle.payment_due_date,
            statementBalanceCents: openCycle.statement_balance_cents,
            minimumPaymentCents: openCycle.minimum_payment_cents,
            paymentRecordedOn: openCycle.payment_recorded_on,
            daysUntilPaymentDue: diffInDays(normalizedAsOf, currentDueDate),
            daysSinceStatement:
              statementDate && normalizedAsOf >= statementDate
                ? daysBetween(statementDate, normalizedAsOf)
                : 0,
            isOverdue:
              currentDueDate &&
              currentDueDate < normalizedAsOf &&
              !openCycle.payment_recorded_on,
            isPaid: Boolean(openCycle.payment_recorded_on),
          }
        : null,
      upcomingCycle: {
        cycleStartDate: nextCycleStartDate
          ? toIsoDate(nextCycleStartDate)
          : null,
        statementDate: nextStatementDate ? toIsoDate(nextStatementDate) : null,
        paymentDueDate: nextPaymentDueDate
          ? toIsoDate(nextPaymentDueDate)
          : null,
        daysUntilStatement: diffInDays(normalizedAsOf, nextStatementDate),
        daysUntilPaymentDue: diffInDays(normalizedAsOf, nextPaymentDueDate),
      },
    };
  });

  summaries.sort((a, b) => {
    const aDue =
      a.currentCycle?.paymentDueDate || a.upcomingCycle.paymentDueDate;
    const bDue =
      b.currentCycle?.paymentDueDate || b.upcomingCycle.paymentDueDate;

    if (!aDue && !bDue) {
      return 0;
    }

    if (!aDue) {
      return 1;
    }

    if (!bDue) {
      return -1;
    }

    return aDue.localeCompare(bDue);
  });

  return summaries.map(serializePaymentCycle);
};

const recordPaymentForCycle = async (currentUser, id, payload = {}) => {
  const cycle = await creditCardCyclesRepository.findById(id);

  if (!cycle) {
    throw createError(404, 'Payment cycle not found');
  }

  const card = await creditCardsRepository.findById(cycle.credit_card_id, {
    includeInactive: true,
  });

  if (!card) {
    throw createError(404, 'Payment cycle not found');
  }

  if (currentUser.role !== 'admin' && card.user_id !== currentUser.id) {
    throw createError(404, 'Payment cycle not found');
  }

  let paymentRecordedOn = null;

  if (payload.clear) {
    paymentRecordedOn = null;
  } else if (payload.paymentRecordedOn) {
    const normalized = toDate(payload.paymentRecordedOn);

    if (!normalized) {
      throw createError(400, 'Unable to parse provided payment date');
    }

    paymentRecordedOn = toIsoDate(normalized);
  } else {
    paymentRecordedOn = toIsoDate(new Date());
  }

  await creditCardCyclesRepository.updateById(id, {
    payment_recorded_on: paymentRecordedOn,
  });

  const summaries = await listPaymentCycles(currentUser, {
    userId: card.user_id,
    asOf: payload.asOf,
  });

  return summaries.find((entry) => entry.creditCardId === card.id) || null;
};

module.exports = {
  listPaymentCycles,
  recordPaymentForCycle,
};
