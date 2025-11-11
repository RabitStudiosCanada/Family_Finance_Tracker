const pickDefined = (value) => {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== undefined && entry !== null);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, entryValue]) => entryValue !== undefined && entryValue !== null
      )
    );
  }

  return value;
};

const serializeUser = (user) =>
  pickDefined({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: Boolean(user.is_active),
    archivedAt: user.archived_at,
    role: pickDefined({
      id: user.role_id,
      code: user.role_code,
      name: user.role_name,
    }),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });

const serializeCreditCard = (card) =>
  pickDefined({
    id: card.id,
    userId: card.user_id,
    nickname: card.nickname,
    issuer: card.issuer,
    lastFour: card.last_four,
    creditLimitCents: card.credit_limit_cents,
    cycleAnchorDay: card.cycle_anchor_day,
    statementDay: card.statement_day,
    paymentDueDay: card.payment_due_day,
    autopayEnabled: Boolean(card.autopay_enabled),
    isActive: Boolean(card.is_active),
    openedAt: card.opened_at,
    closedAt: card.closed_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  });

const serializeIncomeStream = (stream) =>
  pickDefined({
    id: stream.id,
    userId: stream.user_id,
    name: stream.name,
    amountCents: stream.amount_cents,
    frequency: stream.frequency,
    nextExpectedDate: stream.next_expected_date,
    isActive: Boolean(stream.is_active),
    notes: stream.notes,
    createdAt: stream.created_at,
    updatedAt: stream.updated_at,
  });

const serializeTransaction = (transaction) =>
  pickDefined({
    id: transaction.id,
    userId: transaction.user_id,
    creditCardId: transaction.credit_card_id,
    incomeStreamId: transaction.income_stream_id,
    cardCycleId: transaction.card_cycle_id,
    type: transaction.type,
    amountCents: transaction.amount_cents,
    currency: transaction.currency,
    category: transaction.category,
    transactionDate: transaction.transaction_date,
    isPending: Boolean(transaction.is_pending),
    merchant: transaction.merchant,
    memo: transaction.memo,
    occurredAt: transaction.occurred_at,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  });

const serializeAgencySnapshot = (snapshot) =>
  pickDefined({
    id: snapshot.id,
    userId: snapshot.user_id,
    calculatedFor: snapshot.calculated_for,
    creditAgencyCents: snapshot.credit_agency_cents,
    backedAgencyCents: snapshot.backed_agency_cents,
    availableCreditCents: snapshot.available_credit_cents,
    projectedObligationsCents: snapshot.projected_obligations_cents,
    calculatedAt: snapshot.calculated_at,
    notes: snapshot.notes,
    createdAt: snapshot.created_at,
    updatedAt: snapshot.updated_at,
  });

const serializePaymentCycle = (cycle) =>
  pickDefined({
    creditCardId: cycle.creditCardId,
    creditCardNickname: cycle.creditCardNickname,
    creditCardIssuer: cycle.creditCardIssuer,
    creditCardLastFour: cycle.creditCardLastFour,
    autopayEnabled: cycle.autopayEnabled,
    calculatedFor: cycle.calculatedFor,
    recommendedPaymentCents: cycle.recommendedPaymentCents,
    totalStatementBalanceCents: cycle.totalStatementBalanceCents,
    currentCycle: cycle.currentCycle
      ? pickDefined({
          id: cycle.currentCycle.id,
          cycleNumber: cycle.currentCycle.cycleNumber,
          cycleStartDate: cycle.currentCycle.cycleStartDate,
          statementDate: cycle.currentCycle.statementDate,
          paymentDueDate: cycle.currentCycle.paymentDueDate,
          statementBalanceCents: cycle.currentCycle.statementBalanceCents,
          minimumPaymentCents: cycle.currentCycle.minimumPaymentCents,
          paymentRecordedOn: cycle.currentCycle.paymentRecordedOn,
          daysUntilPaymentDue: cycle.currentCycle.daysUntilPaymentDue,
          daysSinceStatement: cycle.currentCycle.daysSinceStatement,
          isOverdue: cycle.currentCycle.isOverdue,
          isPaid: cycle.currentCycle.isPaid,
        })
      : undefined,
    upcomingCycle: cycle.upcomingCycle
      ? pickDefined({
          cycleStartDate: cycle.upcomingCycle.cycleStartDate,
          statementDate: cycle.upcomingCycle.statementDate,
          paymentDueDate: cycle.upcomingCycle.paymentDueDate,
          daysUntilStatement: cycle.upcomingCycle.daysUntilStatement,
          daysUntilPaymentDue: cycle.upcomingCycle.daysUntilPaymentDue,
        })
      : undefined,
  });

module.exports = {
  serializeUser,
  serializeCreditCard,
  serializeIncomeStream,
  serializeTransaction,
  serializeAgencySnapshot,
  serializePaymentCycle,
};
