import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { fetchPaymentCycles } from '../api/finance';
import {
  formatCurrency,
  formatDate,
  formatRelativeDays,
} from '../utils/formatters';

export default function PaymentCyclesPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['paymentCycles', accessToken],
    queryFn: () => fetchPaymentCycles(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const paymentCycles = data?.paymentCycles ?? [];

  return (
    <div>
      <PageHeader
        title="Payment cycles"
        description="See upcoming statements and due dates across your credit cards."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading payment cycle summaries…
          </div>
        ) : paymentCycles.length ? (
          paymentCycles.map((cycle) => (
            <article
              key={cycle.creditCardId}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {cycle.creditCardNickname}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {cycle.creditCardIssuer} ••••{' '}
                    {cycle.creditCardLastFour || '0000'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {cycle.autopayEnabled ? 'Autopay' : 'Manual pay'}
                </span>
              </header>
              <dl className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Statement balance
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCurrency(cycle.currentCycle?.statementBalanceCents)}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">
                    Minimum due{' '}
                    {formatCurrency(cycle.currentCycle?.minimumPaymentCents)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Recommended payment
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCurrency(cycle.recommendedPaymentCents)}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">
                    {cycle.autopayEnabled
                      ? 'Autopay will cover the minimum.'
                      : 'Manual payment suggested for the full balance.'}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Payment due
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {formatDate(cycle.currentCycle?.paymentDueDate)}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">
                    {formatRelativeDays(
                      cycle.currentCycle?.daysUntilPaymentDue
                    )}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Next statement
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {formatDate(cycle.upcomingCycle?.statementDate)}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">
                    {formatRelativeDays(
                      cycle.upcomingCycle?.daysUntilStatement
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No payment cycles available yet.
          </div>
        )}
      </div>
    </div>
  );
}
