import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

const formatCurrency = (cents) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(
    cents / 100
  );

const formatDate = (value) => new Date(value).toLocaleDateString('en-CA');

const initialCreditCards = [
  {
    id: 'seed-card-1',
    nickname: 'Everyday Cashback',
    issuer: 'ScotiaBank',
    lastFour: '4455',
    creditLimitCents: 1_000_000,
    autopayEnabled: true,
  },
  {
    id: 'seed-card-2',
    nickname: 'Travel Rewards',
    issuer: 'Amex',
    lastFour: '8831',
    creditLimitCents: 1_500_000,
    autopayEnabled: false,
  },
];

const initialIncomeStreams = [
  {
    id: 'seed-income-1',
    name: 'Product Design Salary',
    amountCents: 420_000,
    frequency: 'Semi-monthly',
    nextExpectedDate: '2025-11-15',
  },
  {
    id: 'seed-income-2',
    name: 'Freelance UX Retainer',
    amountCents: 120_000,
    frequency: 'Monthly',
    nextExpectedDate: '2025-12-01',
  },
];

const initialTransactions = [
  {
    id: 'seed-transaction-1',
    category: 'Groceries',
    amountCents: -14532,
    merchant: 'Whole Foods',
    transactionDate: '2025-11-01',
  },
  {
    id: 'seed-transaction-2',
    category: 'Salary',
    amountCents: 210000,
    merchant: 'Brightside Studios',
    transactionDate: '2025-11-01',
  },
];

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <header className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </header>
    {children}
  </section>
);

Section.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function App() {
  const [creditCards, setCreditCards] = useState(initialCreditCards);
  const [incomeStreams, setIncomeStreams] = useState(initialIncomeStreams);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [newCard, setNewCard] = useState({
    nickname: '',
    issuer: '',
    creditLimitCents: '',
  });
  const [newIncome, setNewIncome] = useState({
    name: '',
    amountCents: '',
    frequency: 'Monthly',
  });
  const [newTransaction, setNewTransaction] = useState({
    category: '',
    amountCents: '',
    merchant: '',
    transactionDate: '',
  });

  const projectedMonthlyIncome = useMemo(
    () =>
      incomeStreams.reduce((total, stream) => {
        if (stream.frequency === 'Semi-monthly') {
          return total + (stream.amountCents * 24) / 12;
        }
        if (stream.frequency === 'Monthly') {
          return total + stream.amountCents;
        }
        return total;
      }, 0),
    [incomeStreams]
  );

  const handleAddCreditCard = (event) => {
    event.preventDefault();

    if (!newCard.nickname || !newCard.creditLimitCents) {
      return;
    }

    setCreditCards((current) => [
      {
        id: `card-${crypto.randomUUID()}`,
        nickname: newCard.nickname,
        issuer: newCard.issuer,
        lastFour: '0000',
        creditLimitCents: Number(newCard.creditLimitCents) * 100,
        autopayEnabled: false,
      },
      ...current,
    ]);

    setNewCard({ nickname: '', issuer: '', creditLimitCents: '' });
  };

  const handleAddIncomeStream = (event) => {
    event.preventDefault();

    if (!newIncome.name || !newIncome.amountCents) {
      return;
    }

    setIncomeStreams((current) => [
      {
        id: `income-${crypto.randomUUID()}`,
        name: newIncome.name,
        amountCents: Number(newIncome.amountCents) * 100,
        frequency: newIncome.frequency,
        nextExpectedDate: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);

    setNewIncome({ name: '', amountCents: '', frequency: 'Monthly' });
  };

  const handleAddTransaction = (event) => {
    event.preventDefault();

    if (
      !newTransaction.category ||
      !newTransaction.amountCents ||
      !newTransaction.transactionDate
    ) {
      return;
    }

    setTransactions((current) => [
      {
        id: `txn-${crypto.randomUUID()}`,
        category: newTransaction.category,
        amountCents: Number(newTransaction.amountCents) * 100,
        merchant: newTransaction.merchant,
        transactionDate: newTransaction.transactionDate,
      },
      ...current,
    ]);

    setNewTransaction({
      category: '',
      amountCents: '',
      merchant: '',
      transactionDate: '',
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Family Finance Tracker
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Adult Finance Workspace
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Track everyday credit usage, predictable income, and recent
            transactions while the secure API evolves. These sample workflows
            mirror the new Phase&nbsp;1 endpoints so the UI can be wired up
            next.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Section
            title="Credit Cards"
            description="Capture statement-ready details and monitor available credit for each card."
          >
            <form
              onSubmit={handleAddCreditCard}
              className="mb-4 grid gap-3 sm:grid-cols-4 sm:items-end"
            >
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Nickname
                <input
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={newCard.nickname}
                  onChange={(event) =>
                    setNewCard((state) => ({
                      ...state,
                      nickname: event.target.value,
                    }))
                  }
                  placeholder="Daily card"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Issuer
                <input
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={newCard.issuer}
                  onChange={(event) =>
                    setNewCard((state) => ({
                      ...state,
                      issuer: event.target.value,
                    }))
                  }
                  placeholder="Bank"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Limit (CAD)
                <input
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  value={newCard.creditLimitCents}
                  onChange={(event) =>
                    setNewCard((state) => ({
                      ...state,
                      creditLimitCents: event.target.value,
                    }))
                  }
                  placeholder="7500"
                />
              </label>
              <button
                type="submit"
                className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Add card
              </button>
            </form>

            <ul className="space-y-3">
              {creditCards.map((card) => (
                <li
                  key={card.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {card.nickname}
                    </p>
                    <p className="text-sm text-slate-600">
                      {card.issuer} •••• {card.lastFour ?? '0000'}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-900">
                      {formatCurrency(card.creditLimitCents)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Autopay{' '}
                      {card.autopayEnabled ? 'enabled' : 'manual payment'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Income Streams"
            description="Summaries of predictable inflows keep agency projections grounded."
          >
            <form onSubmit={handleAddIncomeStream} className="mb-4 grid gap-3">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Stream name
                <input
                  className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={newIncome.name}
                  onChange={(event) =>
                    setNewIncome((state) => ({
                      ...state,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Retainer work"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Amount (CAD)
                  <input
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    type="number"
                    min="0"
                    value={newIncome.amountCents}
                    onChange={(event) =>
                      setNewIncome((state) => ({
                        ...state,
                        amountCents: event.target.value,
                      }))
                    }
                    placeholder="1500"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Frequency
                  <select
                    className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={newIncome.frequency}
                    onChange={(event) =>
                      setNewIncome((state) => ({
                        ...state,
                        frequency: event.target.value,
                      }))
                    }
                  >
                    <option>Monthly</option>
                    <option>Semi-monthly</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Add income
              </button>
            </form>

            <ul className="space-y-3">
              {incomeStreams.map((stream) => (
                <li
                  key={stream.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {stream.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {stream.frequency}
                      </p>
                    </div>
                    <div className="text-right text-sm font-medium text-slate-900">
                      {formatCurrency(stream.amountCents)}
                    </div>
                  </div>
                  {stream.nextExpectedDate && (
                    <p className="mt-2 text-xs text-slate-500">
                      Next expected {formatDate(stream.nextExpectedDate)}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
              Projected monthly income:{' '}
              <span className="font-semibold">
                {formatCurrency(projectedMonthlyIncome)}
              </span>
            </div>
          </Section>
        </section>

        <Section
          title="Recent Transactions"
          description="Log day-to-day movement between credit and cash to inform agency calculations."
        >
          <form
            onSubmit={handleAddTransaction}
            className="mb-4 grid gap-3 md:grid-cols-4 md:items-end"
          >
            <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
              Category
              <input
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newTransaction.category}
                onChange={(event) =>
                  setNewTransaction((state) => ({
                    ...state,
                    category: event.target.value,
                  }))
                }
                placeholder="Groceries"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Amount (CAD)
              <input
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                type="number"
                value={newTransaction.amountCents}
                onChange={(event) =>
                  setNewTransaction((state) => ({
                    ...state,
                    amountCents: event.target.value,
                  }))
                }
                placeholder="-140.32"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Date
              <input
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                type="date"
                value={newTransaction.transactionDate}
                onChange={(event) =>
                  setNewTransaction((state) => ({
                    ...state,
                    transactionDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
              Merchant / Memo
              <input
                className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newTransaction.merchant}
                onChange={(event) =>
                  setNewTransaction((state) => ({
                    ...state,
                    merchant: event.target.value,
                  }))
                }
                placeholder="Describe the movement"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 md:col-span-2"
            >
              Add transaction
            </button>
          </form>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr className="text-slate-600">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Merchant</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="odd:bg-white even:bg-slate-50"
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {transaction.merchant || '—'}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        transaction.amountCents < 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(transaction.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </main>
  );
}
