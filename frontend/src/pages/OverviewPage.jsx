import { useMemo } from 'react';
import { useQuery } from '../hooks/useQuery';

import MetricCard from '../components/MetricCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import QuickAddTransaction from '../components/QuickAddTransaction.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import {
  fetchAgencySnapshots,
  fetchCreditCards,
  fetchIncomeStreams,
  fetchPaymentCycles,
  fetchProjectedExpenses,
  fetchTransactions,
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

export default function OverviewPage() {
  const { accessToken } = useAuth();

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

  const transactionsQuery = useQuery({
    queryKey: ['transactions', accessToken],
    queryFn: () => fetchTransactions(accessToken, { type: 'expense' }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const { refetch: refetchAgency } = agencyQuery;
  const { refetch: refetchExpenses } = transactionsQuery;

  const handleQuickAddSuccess = () => {
    refetchExpenses();
    refetchAgency();
  };

  const latestSnapshot = agencyQuery.data?.snapshots?.[0] ?? null;
  const metrics = metricsConfig(latestSnapshot);
  const warnings = latestSnapshot?.warnings ?? [];

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

  const totalCreditLimit = useMemo(() => {
    const cards = creditCardsQuery.data?.creditCards ?? [];
    return cards.reduce((sum, card) => sum + (card.creditLimitCents ?? 0), 0);
  }, [creditCardsQuery.data]);

  const monthlyIncome = useMemo(() => {
    const streams = incomeStreamsQuery.data?.incomeStreams ?? [];
    return streams.reduce((sum, stream) => sum + (stream.amountCents ?? 0), 0);
  }, [incomeStreamsQuery.data]);

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
                    : 'Credit utilization';

                return (
                  <li
                    key={`${warning.type}-${warning.threshold}`}
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
