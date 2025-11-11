import { useMemo, useState } from 'react';

import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { fetchCreditCards, fetchTransactions } from '../api/finance';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');

  const queryParams = useMemo(
    () => ({
      type: typeFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: categoryFilter.trim() || undefined,
      creditCardId: cardFilter || undefined,
    }),
    [typeFilter, startDate, endDate, categoryFilter, cardFilter]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'transactions',
      accessToken,
      queryParams.type || null,
      queryParams.startDate || null,
      queryParams.endDate || null,
      queryParams.category || null,
      queryParams.creditCardId || null,
    ],
    queryFn: () => fetchTransactions(accessToken, queryParams),
    enabled: Boolean(accessToken),
  });

  const creditCardsQuery = useQuery({
    queryKey: ['creditCards', accessToken],
    queryFn: () => fetchCreditCards(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
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

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('');
    setCardFilter('');
  };

  const creditCards = creditCardsQuery.data?.creditCards ?? [];

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

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              End date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Category
            </span>
            <input
              type="text"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="e.g. Groceries"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Credit card
            </span>
            <select
              value={cardFilter}
              onChange={(event) => setCardFilter(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All cards</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.nickname} •••• {card.lastFour || '0000'}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Reset filters
            </button>
          </div>
        </form>
      </div>

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
