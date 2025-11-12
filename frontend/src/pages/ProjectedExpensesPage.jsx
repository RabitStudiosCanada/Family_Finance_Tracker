import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ApiError } from '../api/client';
import {
  cancelProjectedExpense,
  commitProjectedExpense,
  createProjectedExpense,
  deleteProjectedExpense,
  fetchCreditCards,
  fetchProjectedExpenses,
  markProjectedExpensePaid,
  updateProjectedExpense,
} from '../api/finance';
import { useQuery } from '../hooks/useQuery';
import { useAuth } from '../providers/AuthProvider.jsx';
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

const describeCard = (card) => {
  if (!card) {
    return 'Card';
  }

  const base = card.nickname || card.issuer || 'Untitled card';

  return card.lastFour ? `${base} •••• ${card.lastFour}` : base;
};

const STATUS_META = {
  planned: {
    label: 'Planned',
    description: 'Ready to be committed when you decide to move forward.',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  committed: {
    label: 'Committed',
    description: 'Funds have been reserved to cover this upcoming expense.',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  paid: {
    label: 'Paid',
    description: 'Expense has been cleared and reconciled.',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Archived from planning without impacting agency.',
    badgeClass: 'bg-slate-200 text-slate-600',
  },
};

const FILTERS = [
  {
    id: 'active',
    label: 'Active',
    description: 'Projected expenses that still need action.',
    statuses: ['planned', 'committed'],
  },
  {
    id: 'planned',
    label: 'Planned',
    description: 'Upcoming ideas that have not been committed yet.',
    statuses: ['planned'],
  },
  {
    id: 'committed',
    label: 'Committed',
    description: 'Obligations that are already backed by agency.',
    statuses: ['committed'],
  },
  {
    id: 'paid',
    label: 'Paid',
    description: 'Historical items you already reconciled.',
    statuses: ['paid'],
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    description: 'Projections that were cancelled or skipped.',
    statuses: ['cancelled'],
  },
  {
    id: 'all',
    label: 'All',
    description: 'Every projected expense regardless of status.',
    statuses: undefined,
  },
];

const centsToAmount = (amountCents) => {
  if (typeof amountCents !== 'number') {
    return '';
  }

  return (amountCents / 100).toFixed(2);
};

const buildFormInitialValues = (expense) => ({
  category: expense?.category ?? '',
  amount: centsToAmount(expense?.amountCents),
  expectedDate: expense?.expectedDate ?? '',
  creditCardId: expense?.creditCardId ?? '',
  notes: expense?.notes ?? '',
});

function ProjectedExpenseForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  error,
  onCancel,
  creditCards,
}) {
  const [formValues, setFormValues] = useState(() => initialValues);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    setFormValues(initialValues);
    setValidationError(null);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);

    const category = formValues.category.trim();
    const amountValue = Number.parseFloat(formValues.amount);
    const expectedDate = formValues.expectedDate;

    if (!category) {
      setValidationError('Category is required.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setValidationError('Enter a positive amount.');
      return;
    }

    if (!expectedDate) {
      setValidationError('Expected date is required.');
      return;
    }

    const payload = {
      category,
      amountCents: Math.round(amountValue * 100),
      expectedDate,
    };

    if (formValues.creditCardId) {
      payload.creditCardId = formValues.creditCardId;
    }

    const notes = formValues.notes.trim();
    if (notes) {
      payload.notes = notes;
    } else if (initialValues.notes) {
      payload.notes = '';
    }

    try {
      await onSubmit(payload);
    } catch (submitError) {
      const message =
        submitError instanceof ApiError
          ? submitError.message
          : submitError instanceof Error
            ? submitError.message
            : 'Unable to save projected expense.';
      setValidationError(message);
    }
  };

  const resolvedError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Category
          </span>
          <input
            type="text"
            name="category"
            value={formValues.category}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Amount</span>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={formValues.amount}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Expected date
          </span>
          <input
            type="date"
            name="expectedDate"
            value={formValues.expectedDate}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Credit card (optional)
          </span>
          <select
            name="creditCardId"
            value={formValues.creditCardId}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No card linked</option>
            {creditCards.map((card) => (
              <option key={card.id} value={card.id}>
                {describeCard(card)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          Notes (optional)
        </span>
        <textarea
          name="notes"
          value={formValues.notes}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {resolvedError ? (
        <p className="text-sm text-rose-600" role="alert">
          {resolvedError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function ProjectedExpensesPage() {
  const { accessToken } = useAuth();
  const [filterId, setFilterId] = useState('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [createStatus, setCreateStatus] = useState('idle');
  const [editStatus, setEditStatus] = useState('idle');
  const [transitionType, setTransitionType] = useState(null);
  const [transitionError, setTransitionError] = useState(null);

  const activeFilter =
    FILTERS.find((filter) => filter.id === filterId) ?? FILTERS[0];

  const emptyFormValues = useMemo(() => buildFormInitialValues(), []);

  const expensesQuery = useQuery({
    queryKey: ['projectedExpenses', accessToken, activeFilter.id],
    queryFn: () =>
      fetchProjectedExpenses(accessToken, {
        statuses: activeFilter.statuses,
      }),
    enabled: Boolean(accessToken),
  });

  const creditCardsQuery = useQuery({
    queryKey: ['creditCards', accessToken],
    queryFn: () => fetchCreditCards(accessToken),
    enabled: Boolean(accessToken),
  });

  const creditCards = creditCardsQuery.data?.creditCards ?? [];

  const expenses = useMemo(() => {
    const items = expensesQuery.data?.projectedExpenses ?? [];
    return [...items].sort((a, b) => {
      const first = a.expectedDate ?? '';
      const second = b.expectedDate ?? '';
      return first.localeCompare(second);
    });
  }, [expensesQuery.data]);

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [expenses, selectedExpenseId]
  );

  const selectedExpenseCard = selectedExpense?.creditCardId
    ? (creditCards.find((card) => card.id === selectedExpense.creditCardId) ??
      null)
    : null;

  const handleCloseDetail = () => {
    setSelectedExpenseId(null);
    setTransitionError(null);
  };

  const handleEditFromDetail = () => {
    if (!selectedExpense) {
      return;
    }

    setEditingExpenseId(selectedExpense.id);
    setSelectedExpenseId(null);
    setTransitionError(null);
  };

  useEffect(() => {
    if (!selectedExpenseId || expensesQuery.isLoading) {
      return;
    }

    const exists = expenses.some((expense) => expense.id === selectedExpenseId);

    if (!exists) {
      setSelectedExpenseId(null);
    }
  }, [expenses, expensesQuery.isLoading, selectedExpenseId]);

  const editingExpense = useMemo(
    () => expenses.find((expense) => expense.id === editingExpenseId) ?? null,
    [editingExpenseId, expenses]
  );

  useEffect(() => {
    if (!editingExpenseId || expensesQuery.isLoading) {
      return;
    }

    const exists = expenses.some((expense) => expense.id === editingExpenseId);

    if (!exists) {
      setEditingExpenseId(null);
    }
  }, [editingExpenseId, expenses, expensesQuery.isLoading]);

  const isCreating = createStatus === 'submitting';
  const isEditing = editStatus === 'submitting';

  const handleCreateSubmit = async (payload) => {
    if (!accessToken) {
      return;
    }

    setCreateStatus('submitting');
    setCreateError(null);

    try {
      await createProjectedExpense(accessToken, payload);
      await expensesQuery.refetch();
      setIsCreateOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to create projected expense.';
      setCreateError(message);
      throw error;
    } finally {
      setCreateStatus('idle');
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!accessToken || !editingExpenseId) {
      return;
    }

    setEditStatus('submitting');
    setEditError(null);

    try {
      await updateProjectedExpense(accessToken, editingExpenseId, payload);
      await expensesQuery.refetch();
      setEditingExpenseId(null);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to update projected expense.';
      setEditError(message);
      throw error;
    } finally {
      setEditStatus('idle');
    }
  };

  const executeTransition = async (action, payload) => {
    if (!accessToken || !selectedExpenseId) {
      return;
    }

    if (typeof window !== 'undefined') {
      if (action === 'cancel') {
        const confirmed = window.confirm(
          'Cancel this projected expense? You can delete it after cancelling.'
        );

        if (!confirmed) {
          return;
        }
      }

      if (action === 'delete') {
        const confirmed = window.confirm(
          'Permanently delete this projected expense? This cannot be undone.'
        );

        if (!confirmed) {
          return;
        }
      }
    }

    setTransitionType(action);
    setTransitionError(null);

    try {
      if (action === 'commit') {
        await commitProjectedExpense(accessToken, selectedExpenseId);
      } else if (action === 'markPaid') {
        await markProjectedExpensePaid(accessToken, selectedExpenseId, payload);
      } else if (action === 'cancel') {
        await cancelProjectedExpense(accessToken, selectedExpenseId, payload);
      } else if (action === 'delete') {
        await deleteProjectedExpense(accessToken, selectedExpenseId);
      }

      await expensesQuery.refetch();

      if (action === 'delete') {
        setSelectedExpenseId(null);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to update projected expense.';
      setTransitionError(message);
    } finally {
      setTransitionType(null);
    }
  };

  const handleRequestCancel = () => {
    setIsCreateOpen(false);
    setCreateError(null);
  };

  const handleRequestEditCancel = () => {
    setEditingExpenseId(null);
    setEditError(null);
  };

  const handleOpenDetail = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setTransitionError(null);
  };

  const isTransitioning = Boolean(transitionType);

  return (
    <div>
      <PageHeader
        title="Projected expenses"
        description="Plan, commit, and reconcile upcoming obligations before they impact your backed agency."
      />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Planning workspace
          </h2>
          <p className="text-sm text-slate-600">{activeFilter.description}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setCreateError(null);
          }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Plan projected expense
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.id === activeFilter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setFilterId(filter.id)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                isActive
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {expensesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading projections…</p>
        ) : expenses.length ? (
          <ul className="space-y-3">
            {expenses.map((expense) => {
              const meta = STATUS_META[expense.status] ?? {
                label: expense.status,
                badgeClass: 'bg-slate-100 text-slate-600',
              };
              const relativeDays = relativeDaysFromToday(expense.expectedDate);

              return (
                <li key={expense.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(expense.id)}
                    className="w-full rounded-xl border border-slate-200 p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {expense.category}
                        </p>
                        <p className="text-xs text-slate-500">
                          Expected {formatDate(expense.expectedDate)} •{' '}
                          {formatRelativeDays(relativeDays)}
                        </p>
                        {expense.notes ? (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                            {expense.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <p className="text-base font-semibold text-slate-900">
                          {formatCurrency(expense.amountCents)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">
            No projected expenses match this filter. Start by planning a new
            obligation.
          </p>
        )}
      </div>

      <Modal
        open={isCreateOpen}
        onClose={handleRequestCancel}
        title="Plan a projected expense"
        description="Stage an upcoming obligation so backed agency can prepare for it."
        footer={null}
      >
        <ProjectedExpenseForm
          initialValues={emptyFormValues}
          onSubmit={handleCreateSubmit}
          submitLabel="Save projection"
          isSubmitting={isCreating}
          error={createError}
          onCancel={handleRequestCancel}
          creditCards={creditCards}
        />
      </Modal>

      <Modal
        open={Boolean(editingExpense)}
        onClose={handleRequestEditCancel}
        title="Edit projected expense"
        description="Update details before committing or reconciling."
        footer={null}
      >
        {editingExpense ? (
          <ProjectedExpenseForm
            initialValues={buildFormInitialValues(editingExpense)}
            onSubmit={handleEditSubmit}
            submitLabel="Save changes"
            isSubmitting={isEditing}
            error={editError}
            onCancel={handleRequestEditCancel}
            creditCards={creditCards}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(selectedExpense)}
        onClose={handleCloseDetail}
        title={selectedExpense ? selectedExpense.category : 'Projected expense'}
        description="View lifecycle and take action on this projection."
        footer={null}
      >
        {selectedExpense ? (
          <div className="space-y-5 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-slate-900">
                {formatCurrency(selectedExpense.amountCents)}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  STATUS_META[selectedExpense.status]?.badgeClass ||
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {STATUS_META[selectedExpense.status]?.label ||
                  selectedExpense.status}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Expected date
                </p>
                <p className="font-medium text-slate-900">
                  {formatDate(selectedExpense.expectedDate)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatRelativeDays(
                    relativeDaysFromToday(selectedExpense.expectedDate)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Linked card
                </p>
                <p className="font-medium text-slate-900">
                  {selectedExpenseCard
                    ? describeCard(selectedExpenseCard)
                    : selectedExpense?.creditCardId
                      ? 'Linked card'
                      : 'Not linked'}
                </p>
              </div>
            </div>
            {selectedExpense.notes ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {selectedExpense.notes}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {selectedExpense.committedAt ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Committed
                  </p>
                  <p className="font-medium text-slate-900">
                    {formatDate(selectedExpense.committedAt)}
                  </p>
                </div>
              ) : null}
              {selectedExpense.paidAt ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Paid
                  </p>
                  <p className="font-medium text-slate-900">
                    {formatDate(selectedExpense.paidAt)}
                  </p>
                </div>
              ) : null}
              {selectedExpense.cancelledAt ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Cancelled
                  </p>
                  <p className="font-medium text-slate-900">
                    {formatDate(selectedExpense.cancelledAt)}
                  </p>
                  {selectedExpense.cancelledReason ? (
                    <p className="text-xs text-slate-500">
                      {selectedExpense.cancelledReason}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {transitionError ? (
              <p className="text-sm text-rose-600" role="alert">
                {transitionError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEditFromDetail}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Edit details
                </button>
                {selectedExpense.status === 'planned' ? (
                  <button
                    type="button"
                    onClick={() => executeTransition('commit')}
                    disabled={isTransitioning}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {transitionType === 'commit' ? 'Committing…' : 'Commit'}
                  </button>
                ) : null}
                {selectedExpense.status === 'committed' ? (
                  <button
                    type="button"
                    onClick={() => executeTransition('markPaid')}
                    disabled={isTransitioning}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {transitionType === 'markPaid' ? 'Marking…' : 'Mark paid'}
                  </button>
                ) : null}
                {['planned', 'committed'].includes(selectedExpense.status) ? (
                  <button
                    type="button"
                    onClick={() => executeTransition('cancel')}
                    disabled={isTransitioning}
                    className="inline-flex items-center justify-center rounded-md bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {transitionType === 'cancel' ? 'Cancelling…' : 'Cancel'}
                  </button>
                ) : null}
                {selectedExpense.status === 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => executeTransition('delete')}
                    disabled={isTransitioning}
                    className="inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {transitionType === 'delete' ? 'Deleting…' : 'Delete'}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

ProjectedExpenseForm.defaultProps = {
  initialValues: buildFormInitialValues(),
  isSubmitting: false,
  error: null,
};

ProjectedExpenseForm.propTypes = {
  initialValues: PropTypes.shape({
    category: PropTypes.string,
    amount: PropTypes.string,
    expectedDate: PropTypes.string,
    creditCardId: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  creditCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nickname: PropTypes.string,
      issuer: PropTypes.string,
      lastFour: PropTypes.string,
    })
  ).isRequired,
};
