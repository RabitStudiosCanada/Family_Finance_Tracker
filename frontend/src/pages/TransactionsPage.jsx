import { useMemo, useState } from 'react';

import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { fetchTransactions } from '../api/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

const filterOptions = [
  { label: 'All activity', value: undefined },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Payments', value: 'payment' },
  { label: 'Transfers', value: 'transfer' },
];

export default function TransactionsPage() {
  const { accessToken } = useAuth();
  const [typeFilter, setTypeFilter] = useState();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['transactions', accessToken, typeFilter],
    queryFn: () =>
      fetchTransactions(accessToken, typeFilter ? { type: typeFilter } : {}),
    enabled: Boolean(accessToken),
  });

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          return { ...acc, income: acc.income + transaction.amountCents };
        }

        if (transaction.type === 'expense') {
          return {
            ...acc,
            expenses: acc.expenses + Math.abs(transaction.amountCents),
          };
        }

        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  const handleFilterChange = (event) => {
    const value = event.target.value || undefined;
    setTypeFilter(value);
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Track cash flow and spending activity captured through the API."
        actions={
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter || ''}
            onChange={handleFilterChange}
          >
            {filterOptions.map((option) => (
              <option key={option.label} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="text-xs uppercase tracking-wide text-emerald-700">
            Total income
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="text-xs uppercase tracking-wide text-rose-700">
            Total expenses
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(totals.expenses)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Merchant / Memo</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading || isFetching ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  Loading transactions…
                </td>
              </tr>
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {transaction.type}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {transaction.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {transaction.merchant || transaction.memo || '—'}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${
                      transaction.type === 'income'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(transaction.amountCents)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No transactions available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
