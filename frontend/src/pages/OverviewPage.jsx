import { useMemo } from 'react';
import { useQuery } from '../hooks/useQuery';

import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import QuickAddTransaction from '../components/QuickAddTransaction.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import {
  fetchAgencySnapshots,
  fetchCreditCards,
  fetchIncomeStreams,
  fetchPaymentCycles,
  fetchProjectedExpenses,
  fetchTransactions,
  fetchSavingsGoals,
  fetchCategoryBudgetSummaries,
} from '../api/finance';
import {
  formatCurrency,
  formatDate,
  formatRelativeDays,
} from '../utils/formatters';

const relativeDaysFromToday = (isoDate) => {
  if (!isoDate) {
    return null;
  }

  const target = new Date(isoDate);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
};

const metricsConfig = (snapshot) => {
  if (!snapshot) {
    return [];
  }

  return [
    {
      label: 'Backed Agency',
      value: formatCurrency(snapshot.backedAgencyCents),
      hint: 'How much future income is already covering planned expenses.',
      tone: 'success',
    },
    {
      label: 'Available Credit',
      value: formatCurrency(snapshot.availableCreditCents),
      hint: 'Remaining credit limit across all cards after current balances.',
      tone: snapshot.availableCreditCents > 0 ? 'default' : 'danger',
    },
    {
      label: 'Projected Obligations',
      value: formatCurrency(snapshot.projectedObligationsCents),
      hint: 'Expenses and minimum payments coming due over the next 45 days.',
      tone:
        snapshot.projectedObligationsCents > snapshot.backedAgencyCents
          ? 'warning'
          : 'default',
    },
  ];
};

const budgetStatusMeta = {
  ok: {
    label: 'On track',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    tone: 'success',
  },
  warning: {
    label: 'Approaching limit',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    tone: 'warning',
  },
  over: {
    label: 'Over limit',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    tone: 'danger',
  },
};

export default function OverviewPage() {
  const { accessToken } = useAuth();
  const todayReference = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const agencyQuery = useQuery({
    queryKey: ['agencySnapshots', accessToken],
    queryFn: () => fetchAgencySnapshots(accessToken, { limit: 1 }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const creditCardsQuery = useQuery({
    queryKey: ['creditCards', accessToken],
    queryFn: () => fetchCreditCards(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const incomeStreamsQuery = useQuery({
    queryKey: ['incomeStreams', accessToken],
    queryFn: () => fetchIncomeStreams(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const paymentCyclesQuery = useQuery({
    queryKey: ['paymentCycles', accessToken],
    queryFn: () => fetchPaymentCycles(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const projectedExpensesQuery = useQuery({
    queryKey: ['projectedExpenses', accessToken, 'overview'],
    queryFn: () =>
      fetchProjectedExpenses(accessToken, {
        statuses: ['planned', 'committed'],
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const savingsGoalsQuery = useQuery({
    queryKey: ['savingsGoals', accessToken, 'overview'],
    queryFn: () => fetchSavingsGoals(accessToken, { status: 'active' }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', accessToken],
    queryFn: () => fetchTransactions(accessToken, { type: 'expense' }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const budgetSummariesQuery = useQuery({
    queryKey: ['categoryBudgetSummaries', accessToken, todayReference],
    queryFn: () =>
      fetchCategoryBudgetSummaries(accessToken, {
        referenceDate: todayReference,
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const { refetch: refetchAgency } = agencyQuery;
  const { refetch: refetchExpenses } = transactionsQuery;
  const { refetch: refetchBudgets } = budgetSummariesQuery;

  const handleQuickAddSuccess = () => {
    refetchExpenses();
    refetchAgency();
    refetchBudgets();
  };

  const latestSnapshot = agencyQuery.data?.snapshots?.[0] ?? null;
  const metrics = metricsConfig(latestSnapshot);
  const agencyWarnings = useMemo(
    () => latestSnapshot?.warnings ?? [],
    [latestSnapshot]
  );
  const budgetWarnings = useMemo(() => {
    const budgets = budgetSummariesQuery.data?.categoryBudgets ?? [];

    if (!budgets.length) {
      return [];
    }

    return budgets
      .filter(
        (budget) => budget.status === 'warning' || budget.status === 'over'
      )
      .map((budget) => {
        const percent = Math.round((budget.utilisation ?? 0) * 100);
        const threshold = Math.round((budget.warningThreshold ?? 0.85) * 100);

        return {
          type: 'categoryBudget',
          level: budget.status === 'over' ? 'critical' : 'warning',
          message:
            budget.status === 'over'
              ? `${budget.category} budget is over its limit.`
              : `${budget.category} spending is at ${percent}% of its limit.`,
          percent,
          threshold,
          category: budget.category,
        };
      });
  }, [budgetSummariesQuery.data?.categoryBudgets]);
  const warnings = useMemo(
    () => [...agencyWarnings, ...budgetWarnings],
    [agencyWarnings, budgetWarnings]
  );

  const nextPayment = useMemo(() => {
    const cycles = paymentCyclesQuery.data?.paymentCycles ?? [];

    const enriched = cycles
      .map((cycle) => ({
        ...cycle,
        days: cycle.currentCycle?.daysUntilPaymentDue ?? null,
      }))
      .filter((cycle) => cycle.days !== null);

    if (!enriched.length) {
      return null;
    }

    return enriched.sort((a, b) => a.days - b.days)[0];
  }, [paymentCyclesQuery.data]);

  const recentExpenses = useMemo(
    () => (transactionsQuery.data?.transactions ?? []).slice(0, 5),
    [transactionsQuery.data]
  );

  const upcomingProjections = useMemo(() => {
    const items = projectedExpensesQuery.data?.projectedExpenses ?? [];

    return [...items]
      .sort((a, b) => {
        const first = a.expectedDate ?? '';
        const second = b.expectedDate ?? '';
        return first.localeCompare(second);
      })
      .slice(0, 4);
  }, [projectedExpensesQuery.data]);

  const topSavingsGoals = useMemo(() => {
    const goals = savingsGoalsQuery.data?.savingsGoals ?? [];

    return [...goals]
      .sort((a, b) => {
        const aPercent = a.targetAmountCents
          ? a.totalContributionsCents / a.targetAmountCents
          : 0;
        const bPercent = b.targetAmountCents
          ? b.totalContributionsCents / b.targetAmountCents
          : 0;

        return bPercent - aPercent;
      })
      .slice(0, 3);
  }, [savingsGoalsQuery.data]);

  const totalCreditLimit = useMemo(() => {
    const cards = creditCardsQuery.data?.creditCards ?? [];
    return cards.reduce((sum, card) => sum + (card.creditLimitCents ?? 0), 0);
  }, [creditCardsQuery.data]);

  const monthlyIncome = useMemo(() => {
    const streams = incomeStreamsQuery.data?.incomeStreams ?? [];
    return streams.reduce((sum, stream) => sum + (stream.amountCents ?? 0), 0);
  }, [incomeStreamsQuery.data]);

  const budgetsForOverview = useMemo(() => {
    const budgets = budgetSummariesQuery.data?.categoryBudgets ?? [];

    if (!budgets.length) {
      return [];
    }

    return [...budgets]
      .sort((a, b) => (b.utilisation ?? 0) - (a.utilisation ?? 0))
      .slice(0, 3);
  }, [budgetSummariesQuery.data?.categoryBudgets]);

  return (
    <div>
      <PageHeader
        title="Agency Overview"
        description={
          latestSnapshot
            ? `Snapshot recalculated on ${formatDate(latestSnapshot.calculatedAt ?? latestSnapshot.calculatedFor)}.`
            : 'Connect your adult accounts to start tracking agency.'
        }
      />

      {agencyQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Calculating agency insights…
        </div>
      ) : null}

      {latestSnapshot ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <QuickAddTransaction
          creditCards={creditCardsQuery.data?.creditCards ?? []}
          onSuccess={handleQuickAddSuccess}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Financial warnings
            </h2>
            <p className="text-sm text-slate-600">
              We flag when backed agency or credit utilization crosses key
              thresholds.
            </p>
          </header>

          {warnings.length ? (
            <ul className="space-y-3">
              {warnings.map((warning) => {
                const toneClass =
                  {
                    critical: 'border-rose-200 bg-rose-50 text-rose-900',
                    warning: 'border-orange-200 bg-orange-50 text-orange-900',
                    caution: 'border-amber-200 bg-amber-50 text-amber-900',
                  }[warning.level] ||
                  'border-slate-200 bg-slate-50 text-slate-800';

                const descriptor =
                  warning.type === 'backedAgency'
                    ? 'Backed agency coverage'
                    : warning.type === 'creditUtilization'
                      ? 'Credit utilization'
                      : 'Category budget';

                return (
                  <li
                    key={`${warning.type}-${warning.category ?? warning.threshold}`}
                    className={`rounded-xl border p-4 shadow-sm ${toneClass}`}
                  >
                    <p className="text-sm font-semibold">{warning.message}</p>
                    <p className="mt-1 text-xs text-slate-700">
                      {descriptor} at {Math.round(warning.percent)}% (threshold{' '}
                      {warning.threshold}%).
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              No warnings triggered. You have healthy backed agency and credit
              headroom.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Budget utilisation watchlist
            </h2>
            <p className="text-sm text-slate-600">
              Monitor the categories using the most of their budgeted limits.
            </p>
          </header>
          {budgetSummariesQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading budget summaries…</p>
          ) : budgetsForOverview.length ? (
            <ul className="space-y-4">
              {budgetsForOverview.map((budget) => {
                const percent = Math.round((budget.utilisation ?? 0) * 100);
                const progressPercent = Math.min(percent, 100);
                const meta =
                  budgetStatusMeta[budget.status] || budgetStatusMeta.ok;

                return (
                  <li
                    key={budget.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {budget.category}
                        </p>
                        <p className="text-xs text-slate-500">
                          Spent {formatCurrency(budget.spentAmountCents)} of{' '}
                          {formatCurrency(budget.limitAmountCents)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar percent={progressPercent} tone={meta.tone} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Remaining{' '}
                      {formatCurrency(budget.remainingAmountCents ?? 0)} •
                      Warning at{' '}
                      {Math.round((budget.warningThreshold ?? 0.85) * 100)}%
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No category budgets configured yet. Create one to track
              utilisation here.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Top savings goals
            </h2>
            <p className="text-sm text-slate-600">
              Track progress across your most-funded active goals.
            </p>
          </header>
          {savingsGoalsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading savings goals…</p>
          ) : topSavingsGoals.length ? (
            <ul className="space-y-4">
              {topSavingsGoals.map((goal) => {
                const percent = goal.targetAmountCents
                  ? Math.min(
                      100,
                      Math.round(
                        (goal.totalContributionsCents /
                          goal.targetAmountCents) *
                          100
                      )
                    )
                  : 0;
                const tone =
                  percent >= 100
                    ? 'success'
                    : percent >= 75
                      ? 'warning'
                      : 'primary';

                return (
                  <li
                    key={goal.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {goal.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Target {formatCurrency(goal.targetAmountCents)} •
                          Saved {formatCurrency(goal.totalContributionsCents)}
                        </p>
                      </div>
                      {goal.targetDate ? (
                        <p className="text-xs font-medium text-slate-500">
                          {formatDate(goal.targetDate)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <ProgressBar percent={percent} tone={tone} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No active savings goals yet. Create one to start tracking
              progress.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming projected expenses
            </h2>
            <p className="text-sm text-slate-600">
              Track the next obligations you have planned or committed to.
            </p>
          </header>
          {projectedExpensesQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading projections…</p>
          ) : upcomingProjections.length ? (
            <ul className="divide-y divide-slate-200">
              {upcomingProjections.map((expense) => {
                const relativeDays = relativeDaysFromToday(
                  expense.expectedDate
                );
                const statusLabel =
                  expense.status === 'committed'
                    ? 'Committed obligation'
                    : 'Planned obligation';

                return (
                  <li key={expense.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {expense.category}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(expense.expectedDate)} •{' '}
                          {formatRelativeDays(relativeDays)}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(expense.amountCents)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No upcoming projected expenses yet. Plan a projection to see it
              here.
            </p>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Next payment reminder
            </h2>
            <p className="text-sm text-slate-600">
              We surface the closest due date across your cards to help avoid
              interest.
            </p>
          </header>
          {paymentCyclesQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading cycle timelines…</p>
          ) : nextPayment ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p className="text-base font-semibold text-slate-900">
                {nextPayment.creditCardNickname}
              </p>
              <p>
                Payment due{' '}
                {formatRelativeDays(
                  nextPayment.currentCycle.daysUntilPaymentDue
                )}{' '}
                on{' '}
                <span className="font-medium">
                  {formatDate(nextPayment.currentCycle.paymentDueDate)}
                </span>
              </p>
              <p>
                Recommended payment:{' '}
                <span className="font-semibold">
                  {formatCurrency(nextPayment.recommendedPaymentCents)}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No open payment cycles found for your cards.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent expenses
            </h2>
            <p className="text-sm text-slate-600">
              Latest entries across your accounts.
            </p>
          </header>
          {transactionsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading transactions…</p>
          ) : recentExpenses.length ? (
            <ul className="divide-y divide-slate-200">
              {recentExpenses.map((transaction) => (
                <li key={transaction.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {transaction.category}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(transaction.transactionDate)}
                      </p>
                    </div>
                    <p className="font-semibold text-rose-600">
                      {formatCurrency(Math.abs(transaction.amountCents))}
                    </p>
                  </div>
                  {transaction.merchant ? (
                    <p className="text-xs text-slate-500">
                      {transaction.merchant}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No expenses recorded yet.</p>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Total credit limit
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Combined limit across active credit cards used in agency
            calculations.
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalCreditLimit)}
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Monthly predictable income
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sum of all active income streams based on their configured cadence.
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCurrency(monthlyIncome)}
          </p>
        </section>
      </div>
    </div>
  );
}
