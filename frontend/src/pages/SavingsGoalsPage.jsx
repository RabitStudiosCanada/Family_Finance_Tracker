import { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { useQuery } from '../hooks/useQuery';
import { useAuth } from '../providers/AuthProvider.jsx';
import { ApiError } from '../api/client';
import {
  fetchSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  completeSavingsGoal,
  abandonSavingsGoal,
  addSavingsGoalContribution,
  deleteSavingsGoalContribution,
  fetchSavingsGoalContributions,
} from '../api/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

const goalPropType = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  targetAmountCents: PropTypes.number,
  totalContributionsCents: PropTypes.number,
  startDate: PropTypes.string,
  targetDate: PropTypes.string,
  status: PropTypes.oneOf(['active', 'completed', 'abandoned']),
  category: PropTypes.string,
  notes: PropTypes.string,
  completedAt: PropTypes.string,
  abandonedAt: PropTypes.string,
  abandonedReason: PropTypes.string,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
});

const statusFilters = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'abandoned', label: 'Abandoned' },
  { id: 'all', label: 'All goals' },
];

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

const statusToneClasses = {
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  completed: 'text-blue-700 bg-blue-50 border-blue-200',
  abandoned: 'text-rose-700 bg-rose-50 border-rose-200',
};

const contributionSourceLabels = {
  manual: 'Manual',
  transfer: 'Transfer',
  automation: 'Automation',
};

const initialGoalForm = (goal) => ({
  name: goal?.name ?? '',
  targetAmount: goal?.targetAmountCents
    ? String(goal.targetAmountCents / 100)
    : '',
  startDate: goal?.startDate ?? '',
  targetDate: goal?.targetDate ?? '',
  category: goal?.category ?? '',
  notes: goal?.notes ?? '',
});

const parseCurrencyValue = (value) => {
  const sanitized = value.replace(/[$,\s]/gu, '');
  const parsed = Number.parseFloat(sanitized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
};

function GoalFormModal({ open, mode, goal, token, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialGoalForm(goal));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const formId = useId();

  useEffect(() => {
    if (open) {
      setForm(initialGoalForm(goal));
      setStatus('idle');
      setError(null);
    }
  }, [open, goal]);

  const isSubmitting = status === 'submitting';

  const handleRequestClose = () => {
    if (!isSubmitting) {
      onClose?.();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const name = form.name.trim();
    const startDate = form.startDate.trim();
    const targetDate = form.targetDate.trim();
    const category = form.category.trim();
    const notes = form.notes.trim();
    const targetAmountCents = parseCurrencyValue(form.targetAmount);

    if (!name) {
      setStatus('error');
      setError('A goal name is required.');
      return;
    }

    if (!targetAmountCents) {
      setStatus('error');
      setError('Enter a positive target amount.');
      return;
    }

    if (!startDate) {
      setStatus('error');
      setError('A start date is required.');
      return;
    }

    const payload = {
      name,
      targetAmountCents,
      startDate,
      targetDate: targetDate || undefined,
      category: category || undefined,
      notes: notes || undefined,
    };

    setStatus('submitting');
    setError(null);

    try {
      const result =
        mode === 'edit' && goal
          ? await updateSavingsGoal(token, goal.id, payload)
          : await createSavingsGoal(token, payload);
      const savedGoal = result.savingsGoal;

      if (mode !== 'edit') {
        setForm(initialGoalForm());
      }

      setStatus('success');
      onSaved?.(savedGoal);
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to save this savings goal right now.';
      setStatus('error');
      setError(message);
    }
  };

  const modalTitle =
    mode === 'edit' ? 'Edit savings goal' : 'Create savings goal';

  return (
    <Modal
      open={open}
      title={modalTitle}
      onClose={handleRequestClose}
      footer={
        <>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save goal'}
          </button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Goal name
            </span>
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Emergency fund"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Target amount (CAD)
            </span>
            <input
              required
              name="targetAmount"
              value={form.targetAmount}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Start date
            </span>
            <input
              required
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Target date
            </span>
            <input
              type="date"
              name="targetDate"
              value={form.targetDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Category
          </span>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Savings"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Notes</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What milestones or context should we track?"
          />
        </label>
      </form>
    </Modal>
  );
}

GoalFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  goal: goalPropType,
  token: PropTypes.string,
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

GoalFormModal.defaultProps = {
  goal: null,
  token: null,
  onClose: undefined,
  onSaved: undefined,
};

const initialContributionForm = (goal) => {
  const remainingCents = Math.max(
    (goal?.targetAmountCents ?? 0) - (goal?.totalContributionsCents ?? 0),
    0
  );
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);

  return {
    amount: remainingCents ? String(remainingCents / 100) : '',
    contributionDate: isoDate,
    source: 'manual',
    notes: '',
  };
};

function ContributionModal({ open, goal, token, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialContributionForm(goal));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const formId = useId();

  useEffect(() => {
    if (open) {
      setForm(initialContributionForm(goal));
      setStatus('idle');
      setError(null);
    }
  }, [open, goal]);

  const isSubmitting = status === 'submitting';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token || !goal) {
      return;
    }

    const amountCents = parseCurrencyValue(form.amount);

    if (!amountCents) {
      setStatus('error');
      setError('Enter a positive contribution amount.');
      return;
    }

    const contributionDate = form.contributionDate.trim();

    if (!contributionDate) {
      setStatus('error');
      setError('A contribution date is required.');
      return;
    }

    const payload = {
      amountCents,
      contributionDate,
      source: form.source || undefined,
      notes: form.notes.trim() || undefined,
    };

    setStatus('submitting');
    setError(null);

    try {
      const result = await addSavingsGoalContribution(token, goal.id, payload);
      setStatus('success');
      onSaved?.(result.savingsGoal, result.contribution);
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to record this contribution right now.';
      setStatus('error');
      setError(message);
    }
  };

  return (
    <Modal
      open={open}
      title="Log contribution"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save contribution'}
          </button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Amount (CAD)
            </span>
            <input
              required
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Contribution date
            </span>
            <input
              required
              type="date"
              name="contributionDate"
              value={form.contributionDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Source</span>
          <select
            name="source"
            value={form.source}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(contributionSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Notes</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Where did this money come from?"
          />
        </label>
      </form>
    </Modal>
  );
}

ContributionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  goal: goalPropType,
  token: PropTypes.string,
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

ContributionModal.defaultProps = {
  goal: null,
  token: null,
  onClose: undefined,
  onSaved: undefined,
};

function SavingsGoalDetailModal({
  open,
  goal,
  token,
  onClose,
  onGoalUpdated,
  onEdit,
}) {
  const [contributions, setContributions] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isContributionModalOpen, setContributionModalOpen] = useState(false);

  useEffect(() => {
    if (!open || !goal?.id || !token) {
      setContributions([]);
      return;
    }

    let isMounted = true;
    setStatus('loading');
    setError(null);

    fetchSavingsGoalContributions(token, goal.id)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setContributions(result.contributions ?? []);
        setStatus('success');
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        const message =
          fetchError instanceof ApiError
            ? fetchError.message
            : 'Unable to load contributions right now.';
        setError(message);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [open, goal?.id, token]);

  useEffect(() => {
    if (!open) {
      setContributionModalOpen(false);
      setActionError(null);
    }
  }, [open]);

  if (!goal) {
    return null;
  }

  const isActive = goal.status === 'active';
  const percent = goal.targetAmountCents
    ? (goal.totalContributionsCents / goal.targetAmountCents) * 100
    : 0;
  const tone =
    goal.status === 'completed'
      ? 'success'
      : goal.status === 'abandoned'
        ? 'danger'
        : percent >= 75
          ? 'warning'
          : 'primary';
  const remainingCents = Math.max(
    goal.targetAmountCents - (goal.totalContributionsCents ?? 0),
    0
  );
  const descriptionParts = [`Started on ${formatDate(goal.startDate)}`];

  if (goal.targetDate) {
    descriptionParts.push(`targeting ${formatDate(goal.targetDate)}`);
  }

  const descriptionText = descriptionParts.join(', ');

  const handleContributionSaved = (updatedGoal, contribution) => {
    setContributions((previous) => [contribution, ...(previous ?? [])]);
    onGoalUpdated?.(updatedGoal);
    setContributionModalOpen(false);
    setActionError(null);
  };

  const handleDeleteContribution = async (contributionId) => {
    if (!token || !goal || !contributionId) {
      return;
    }

    const confirmed = window.confirm('Remove this contribution?');

    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteSavingsGoalContribution(
        token,
        goal.id,
        contributionId
      );
      setContributions((previous) =>
        (previous ?? []).filter((item) => item.id !== contributionId)
      );
      onGoalUpdated?.(result.savingsGoal);
      setActionError(null);
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to remove this contribution right now.';
      setActionError(message);
    }
  };

  const handleCompleteGoal = async () => {
    if (!token || !goal) {
      return;
    }

    const confirmed = window.confirm('Mark this goal as completed?');

    if (!confirmed) {
      return;
    }

    try {
      const result = await completeSavingsGoal(token, goal.id);
      onGoalUpdated?.(result.savingsGoal);
      setActionError(null);
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to complete this goal right now.';
      setActionError(message);
    }
  };

  const handleAbandonGoal = async () => {
    if (!token || !goal) {
      return;
    }

    const reason = window.prompt(
      'Why are you abandoning this goal? (Optional)'
    );
    const confirmed =
      reason !== null &&
      window.confirm('Are you sure you want to abandon this goal?');

    if (!confirmed) {
      return;
    }

    try {
      const payload = reason ? { reason } : undefined;
      const result = await abandonSavingsGoal(token, goal.id, payload);
      onGoalUpdated?.(result.savingsGoal);
      setActionError(null);
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to abandon this goal right now.';
      setActionError(message);
    }
  };

  return (
    <>
      <Modal
        open={open}
        title={goal.name}
        description={descriptionText}
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        }
      >
        <div className="space-y-6">
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                  statusToneClasses[goal.status]
                }`}
              >
                {statusLabels[goal.status] ?? goal.status}
              </span>
              <p className="mt-3 text-sm text-slate-600">
                Target amount {formatCurrency(goal.targetAmountCents)}
              </p>
              <p className="text-sm text-slate-600">
                Saved so far {formatCurrency(goal.totalContributionsCents)}
              </p>
              <p className="text-sm text-slate-600">
                Remaining {formatCurrency(remainingCents)}
              </p>
              {goal.completedAt ? (
                <p className="mt-2 text-xs text-emerald-600">
                  Completed on {formatDate(goal.completedAt)}
                </p>
              ) : null}
              {goal.abandonedAt ? (
                <p className="mt-2 text-xs text-rose-600">
                  Abandoned on {formatDate(goal.abandonedAt)}
                  {goal.abandonedReason ? ` — ${goal.abandonedReason}` : ''}
                </p>
              ) : null}
              {goal.notes ? (
                <p className="mt-3 text-sm text-slate-600">{goal.notes}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => onEdit?.(goal)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit goal
              </button>
              <button
                type="button"
                onClick={() => setContributionModalOpen(true)}
                disabled={!isActive}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Log contribution
              </button>
              <button
                type="button"
                onClick={handleCompleteGoal}
                disabled={!isActive}
                className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark completed
              </button>
              <button
                type="button"
                onClick={handleAbandonGoal}
                disabled={!isActive}
                className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Abandon goal
              </button>
            </div>
          </div>

          <ProgressBar percent={percent} tone={tone} label="Progress" />

          <section>
            <header className="mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Contributions
              </h3>
              <p className="text-xs text-slate-500">
                Track deposits that move you closer to the target.
              </p>
            </header>
            {status === 'loading' ? (
              <p className="text-sm text-slate-500">Loading contributions…</p>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : contributions.length ? (
              <ul className="space-y-3">
                {contributions.map((contribution) => (
                  <li
                    key={contribution.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(contribution.amountCents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(contribution.contributionDate)} •{' '}
                        {contributionSourceLabels[contribution.source] ||
                          contribution.source}
                      </p>
                      {contribution.notes ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {contribution.notes}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteContribution(contribution.id)}
                      className="text-xs font-semibold text-rose-600 transition hover:text-rose-500"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No contributions recorded yet.
              </p>
            )}
          </section>
        </div>
      </Modal>
      <ContributionModal
        open={isContributionModalOpen}
        goal={goal}
        token={token}
        onClose={() => setContributionModalOpen(false)}
        onSaved={handleContributionSaved}
      />
    </>
  );
}

SavingsGoalDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  goal: goalPropType,
  token: PropTypes.string,
  onClose: PropTypes.func,
  onGoalUpdated: PropTypes.func,
  onEdit: PropTypes.func,
};

SavingsGoalDetailModal.defaultProps = {
  goal: null,
  token: null,
  onClose: undefined,
  onGoalUpdated: undefined,
  onEdit: undefined,
};

function SavingsGoalCard({ goal, onView, onEdit }) {
  const percent = goal.targetAmountCents
    ? (goal.totalContributionsCents / goal.targetAmountCents) * 100
    : 0;
  const tone =
    goal.status === 'completed'
      ? 'success'
      : goal.status === 'abandoned'
        ? 'danger'
        : percent >= 75
          ? 'warning'
          : 'primary';

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {goal.name}
            </h3>
            {goal.category ? (
              <p className="text-sm text-slate-500">{goal.category}</p>
            ) : null}
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
              statusToneClasses[goal.status]
            }`}
          >
            {statusLabels[goal.status] ?? goal.status}
          </span>
        </div>
        <ProgressBar percent={percent} tone={tone} />
        <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Target amount
            </dt>
            <dd className="font-semibold text-slate-900">
              {formatCurrency(goal.targetAmountCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Saved
            </dt>
            <dd className="font-semibold text-slate-900">
              {formatCurrency(goal.totalContributionsCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Started
            </dt>
            <dd>{formatDate(goal.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Target date
            </dt>
            <dd>{formatDate(goal.targetDate)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onView?.(goal)}
          className="inline-flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View details
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(goal)}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Edit
        </button>
      </div>
    </article>
  );
}

SavingsGoalCard.propTypes = {
  goal: goalPropType.isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
};

SavingsGoalCard.defaultProps = {
  onView: undefined,
  onEdit: undefined,
};

export default function SavingsGoalsPage() {
  const { accessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState('active');
  const [detailGoal, setDetailGoal] = useState(null);
  const [goalModalState, setGoalModalState] = useState({
    mode: null,
    goal: null,
  });

  const goalsQuery = useQuery({
    queryKey: ['savingsGoals', accessToken, statusFilter],
    queryFn: () =>
      fetchSavingsGoals(accessToken, {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const savingsGoals = useMemo(
    () => goalsQuery.data?.savingsGoals ?? [],
    [goalsQuery.data]
  );

  useEffect(() => {
    if (!detailGoal) {
      return;
    }

    const updated = savingsGoals.find((goal) => goal.id === detailGoal.id);

    if (updated && updated.updatedAt !== detailGoal.updatedAt) {
      setDetailGoal(updated);
    }
  }, [savingsGoals, detailGoal]);

  const openCreateModal = () => {
    setGoalModalState({ mode: 'create', goal: null });
  };

  const openEditModal = (goal) => {
    setGoalModalState({ mode: 'edit', goal });
  };

  const closeGoalModal = () => {
    setGoalModalState({ mode: null, goal: null });
  };

  const handleGoalSaved = (savedGoal) => {
    closeGoalModal();
    goalsQuery.refetch();

    if (savedGoal && detailGoal?.id === savedGoal.id) {
      setDetailGoal(savedGoal);
    }
  };

  const handleGoalUpdated = (updatedGoal) => {
    setDetailGoal(updatedGoal);
    goalsQuery.refetch();
  };

  const handleViewGoal = (goal) => {
    setDetailGoal(goal);
  };

  const handleCloseDetail = () => {
    setDetailGoal(null);
  };

  return (
    <div>
      <PageHeader
        title="Savings goals"
        description="Track long-term plans, visualize progress, and log contributions to stay aligned with your targets."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New goal
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const isActive = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {goalsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading savings goals…</p>
      ) : savingsGoals.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {savingsGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onView={handleViewGoal}
              onEdit={openEditModal}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {statusFilter === 'all'
            ? 'No savings goals recorded yet. Create one to start tracking progress.'
            : `No ${statusLabels[statusFilter]?.toLowerCase()} goals to show.`}
        </div>
      )}

      {goalModalState.mode ? (
        <GoalFormModal
          open
          mode={goalModalState.mode}
          goal={goalModalState.goal}
          token={accessToken}
          onClose={closeGoalModal}
          onSaved={handleGoalSaved}
        />
      ) : null}

      <SavingsGoalDetailModal
        open={Boolean(detailGoal)}
        goal={detailGoal}
        token={accessToken}
        onClose={handleCloseDetail}
        onGoalUpdated={handleGoalUpdated}
        onEdit={(goal) => {
          openEditModal(goal);
        }}
      />
    </div>
  );
}
