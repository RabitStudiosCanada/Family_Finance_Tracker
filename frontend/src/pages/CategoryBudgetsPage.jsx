import { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useQuery } from '../hooks/useQuery';
import { ApiError } from '../api/client';
import {
  fetchCategoryBudgetSummaries,
  createCategoryBudget,
  updateCategoryBudget,
  deleteCategoryBudget,
} from '../api/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

const statusMeta = {
  ok: {
    label: 'On track',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    tone: 'success',
  },
  warning: {
    label: 'Approaching limit',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    tone: 'warning',
  },
  over: {
    label: 'Over limit',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    tone: 'danger',
  },
};

const formatThresholdForInput = (threshold) => {
  if (threshold === undefined || threshold === null) {
    return '85';
  }

  const percent = threshold * 100;

  if (!Number.isFinite(percent)) {
    return '85';
  }

  return Number.isInteger(percent)
    ? String(percent)
    : percent.toFixed(1).replace(/\.0$/u, '');
};

const parseCurrencyToCents = (value) => {
  if (!value) {
    return null;
  }

  const sanitized = value.replace(/[$,\s]/gu, '');
  const parsed = Number.parseFloat(sanitized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
};

const parseThresholdPercent = (value) => {
  if (!value) {
    return null;
  }

  const sanitized = value.replace(/[%\s]/gu, '');
  const parsed = Number.parseFloat(sanitized);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return parsed / 100;
};

const initialFormState = (budget) => ({
  category: budget?.category ?? '',
  limitAmount: budget?.limitAmountCents
    ? (budget.limitAmountCents / 100).toFixed(2)
    : '',
  period: budget?.period ?? 'monthly',
  warningThreshold: formatThresholdForInput(budget?.warningThreshold),
  periodStartDate: budget?.periodStartDate ?? '',
  periodEndDate: budget?.periodEndDate ?? '',
  isActive: budget?.isActive ?? true,
});

function BudgetFormModal({ open, mode, budget, token, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialFormState(budget));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const formId = useId();

  useEffect(() => {
    if (open) {
      setForm(initialFormState(budget));
      setStatus('idle');
      setError(null);
    }
  }, [open, budget]);

  const isSubmitting = status === 'submitting';

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const category = form.category.trim();

    if (!category) {
      setStatus('error');
      setError('A category name is required.');
      return;
    }

    const limitAmountCents = parseCurrencyToCents(form.limitAmount);

    if (!limitAmountCents) {
      setStatus('error');
      setError('Enter a positive limit amount.');
      return;
    }

    const warningThresholdValue = parseThresholdPercent(form.warningThreshold);

    if (warningThresholdValue !== null && warningThresholdValue > 1) {
      setStatus('error');
      setError('Warning threshold cannot exceed 100%.');
      return;
    }

    const payload = {
      category,
      limitAmountCents,
      period: form.period || undefined,
      warningThreshold: warningThresholdValue ?? undefined,
      periodStartDate: form.periodStartDate || undefined,
      periodEndDate: form.periodEndDate || undefined,
      isActive: form.isActive,
    };

    setStatus('submitting');
    setError(null);

    try {
      if (mode === 'edit' && budget) {
        await updateCategoryBudget(token, budget.id, payload);
      } else {
        await createCategoryBudget(token, payload);
      }

      setStatus('success');
      onSaved?.();
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : submissionError instanceof Error
            ? submissionError.message
            : 'Unable to save this budget right now.';
      setStatus('error');
      setError(message);
    }
  };

  const handleRequestClose = () => {
    if (!isSubmitting) {
      onClose?.();
    }
  };

  const resolvedError = error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id={formId}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Category
          </span>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="e.g. Groceries"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Budget limit
          </span>
          <input
            type="text"
            name="limitAmount"
            value={form.limitAmount}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="450.00"
            inputMode="decimal"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Warning threshold (%)
          </span>
          <input
            type="text"
            name="warningThreshold"
            value={form.warningThreshold}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="85"
            inputMode="decimal"
          />
          <span className="mt-1 block text-xs text-slate-500">
            We’ll alert you when utilisation meets or exceeds this percentage.
          </span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Period</span>
          <select
            name="period"
            value={form.period}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="monthly">Monthly</option>
            <option value="cycle">Card cycle</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Period start
          </span>
          <input
            type="date"
            name="periodStartDate"
            value={form.periodStartDate}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Period end
          </span>
          <input
            type="date"
            name="periodEndDate"
            value={form.periodEndDate}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Budget is active
      </label>

      {resolvedError ? (
        <p className="text-sm text-rose-600">{resolvedError}</p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleRequestClose}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting
            ? 'Saving…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Create budget'}
        </button>
      </div>
    </form>
  );
}

BudgetFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  budget: PropTypes.shape({
    id: PropTypes.string,
    category: PropTypes.string,
    limitAmountCents: PropTypes.number,
    warningThreshold: PropTypes.number,
    period: PropTypes.string,
    periodStartDate: PropTypes.string,
    periodEndDate: PropTypes.string,
    isActive: PropTypes.bool,
  }),
  token: PropTypes.string,
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

BudgetFormModal.defaultProps = {
  budget: null,
  token: null,
  onClose: undefined,
  onSaved: undefined,
};

function BudgetStatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.ok;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

BudgetStatusBadge.propTypes = {
  status: PropTypes.oneOf(['ok', 'warning', 'over']).isRequired,
};

const todayReferenceDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

export default function CategoryBudgetsPage() {
  const { accessToken } = useAuth();
  const referenceDate = useMemo(() => todayReferenceDate(), []);
  const budgetsQuery = useQuery({
    queryKey: ['categoryBudgetSummaries', accessToken, referenceDate],
    queryFn: () => fetchCategoryBudgetSummaries(accessToken, { referenceDate }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const sortedBudgets = useMemo(() => {
    const items = budgetsQuery.data?.categoryBudgets ?? [];

    return [...items].sort((first, second) => {
      const firstValue = first?.utilisation ?? 0;
      const secondValue = second?.utilisation ?? 0;
      return secondValue - firstValue;
    });
  }, [budgetsQuery.data?.categoryBudgets]);

  const stats = useMemo(() => {
    const total = sortedBudgets.length;
    const active = sortedBudgets.filter((budget) => budget.isActive).length;
    const warningCount = sortedBudgets.filter(
      (budget) => budget.status === 'warning'
    ).length;
    const overCount = sortedBudgets.filter(
      (budget) => budget.status === 'over'
    ).length;

    return { total, active, warningCount, overCount };
  }, [sortedBudgets]);

  const [formMode, setFormMode] = useState('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const editingBudget = useMemo(
    () => sortedBudgets.find((budget) => budget.id === editingBudgetId) ?? null,
    [sortedBudgets, editingBudgetId]
  );

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingBudgetId(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleOpenEdit = (budgetId) => {
    setFormMode('edit');
    setEditingBudgetId(budgetId);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingBudgetId(null);
  };

  const handleSaved = async () => {
    await budgetsQuery.refetch();
    handleCloseModal();
  };

  const handleDelete = async (budget) => {
    if (!budget || !accessToken) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Delete the ${budget.category} budget? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategoryBudget(accessToken, budget.id);
      await budgetsQuery.refetch();
      setActionError(null);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to delete this budget right now.';
      setActionError(message);
    }
  };

  const warningBudgets = useMemo(
    () => sortedBudgets.filter((budget) => budget.status !== 'ok'),
    [sortedBudgets]
  );

  return (
    <div>
      <PageHeader
        title="Category budgets"
        description="Set spending guardrails per category and monitor utilisation as transactions roll in."
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            New budget
          </button>
        }
      />

      {warningBudgets.length ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">
            {warningBudgets.length}{' '}
            {warningBudgets.length === 1
              ? 'budget needs attention'
              : 'budgets need attention'}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Review categories approaching or exceeding their limits to avoid
            surprises.
          </p>
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Budget overview
          </h2>
          <p className="text-sm text-slate-600">
            Active guardrails help you steer spending before it goes overboard.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total budgets
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Active
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.active}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Approaching limit
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">
              {stats.warningCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Over limit
            </p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">
              {stats.overCount}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        {budgetsQuery.isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading budgets…
          </div>
        ) : sortedBudgets.length ? (
          sortedBudgets.map((budget) => {
            const meta = statusMeta[budget.status] || statusMeta.ok;
            const utilisationPercent = Math.round(
              (budget.utilisation ?? 0) * 100
            );
            const progressPercent = Math.min(utilisationPercent, 100);
            const remainingLabel =
              budget.remainingAmountCents && budget.remainingAmountCents > 0
                ? formatCurrency(budget.remainingAmountCents)
                : formatCurrency(0);

            return (
              <article
                key={budget.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {budget.category}
                      </h3>
                      <BudgetStatusBadge status={budget.status} />
                      {!budget.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Spent {formatCurrency(budget.spentAmountCents)} of{' '}
                      {formatCurrency(budget.limitAmountCents)} (
                      {utilisationPercent}% utilised)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(budget.id)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(budget)}
                      className="inline-flex items-center justify-center rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <ProgressBar
                      percent={progressPercent}
                      tone={meta.tone}
                      label="Spending progress"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Remaining</p>
                    <p>{remainingLabel}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Warning at{' '}
                      {Math.round((budget.warningThreshold ?? 0.85) * 100)}%
                      utilisation
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Period</p>
                    <p>
                      {formatDate(budget.periodStartDate)} –{' '}
                      {formatDate(budget.periodEndDate)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Tracking as{' '}
                      {budget.period === 'cycle' ? 'card cycle' : 'monthly'}{' '}
                      budget
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center text-sm text-slate-600">
            No budgets yet. Create a category budget to start monitoring your
            spending limits.
          </div>
        )}
      </section>

      <Modal
        open={isFormOpen}
        onClose={handleCloseModal}
        title={
          formMode === 'edit'
            ? 'Edit category budget'
            : 'Create category budget'
        }
        description="Budgets track spend against limits so you can act before you overshoot."
        footer={null}
      >
        <BudgetFormModal
          open={isFormOpen}
          mode={formMode}
          budget={editingBudget}
          token={accessToken}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
  );
}
