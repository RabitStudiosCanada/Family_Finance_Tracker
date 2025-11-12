import { useCallback, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';

import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import Modal from '../components/Modal.jsx';
import { ApiError } from '../api/client';
import {
  fetchIncomeStreams,
  createIncomeStream,
  updateIncomeStream,
  archiveIncomeStream,
} from '../api/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

const frequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  semimonthly: 'Semi-monthly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const incomeFormState = (stream) => ({
  name: stream?.name ?? '',
  amount: stream?.amountCents ? String(stream.amountCents / 100) : '',
  frequency: stream?.frequency ?? 'monthly',
  nextExpectedDate: stream?.nextExpectedDate ?? '',
  notes: stream?.notes ?? '',
});

const incomeStreamPropType = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  amountCents: PropTypes.number,
  frequency: PropTypes.string,
  nextExpectedDate: PropTypes.string,
  notes: PropTypes.string,
});

function IncomeStreamModal({ open, mode, stream, token, onClose, onSaved }) {
  const [form, setForm] = useState(() => incomeFormState(stream));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const formId = useId();

  const resetState = useCallback(() => {
    setForm(incomeFormState(stream));
    setStatus('idle');
    setError(null);
  }, [stream]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const isSubmitting = status === 'submitting';

  const handleRequestClose = () => {
    if (!isSubmitting) {
      onClose?.();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setStatus('error');
      setError('Name is required.');
      return;
    }

    const amountValue = Number.parseFloat(form.amount);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setStatus('error');
      setError('Enter a positive recurring amount.');
      return;
    }

    const frequency = form.frequency || 'monthly';

    setStatus('submitting');
    setError(null);

    const payload = {
      name,
      amountCents: Math.round(amountValue * 100),
      frequency,
      nextExpectedDate: form.nextExpectedDate || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (mode === 'edit' && stream) {
        await updateIncomeStream(token, stream.id, payload);
      } else {
        await createIncomeStream(token, payload);
        resetState();
      }

      setStatus('success');
      onSaved?.();
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to save this income stream right now.';
      setStatus('error');
      setError(message);
    }
  };

  const modalTitle =
    mode === 'edit' ? 'Edit income stream' : 'Add income stream';

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
            {isSubmitting ? 'Saving…' : 'Save stream'}
          </button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Name</span>
            <input
              type="text"
              name="name"
              required
              maxLength={120}
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Amount (CAD)
            </span>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Frequency
            </span>
            <select
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(frequencyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Next expected date
            </span>
            <input
              type="date"
              name="nextExpectedDate"
              value={form.nextExpectedDate}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Notes</span>
          <textarea
            name="notes"
            maxLength={500}
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </form>
    </Modal>
  );
}

IncomeStreamModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  stream: incomeStreamPropType,
  token: PropTypes.string,
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

export default function IncomeStreamsPage() {
  const { accessToken } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incomeStreams', accessToken],
    queryFn: () => fetchIncomeStreams(accessToken),
    enabled: Boolean(accessToken),
  });

  const streams = data?.incomeStreams ?? [];
  const [modalState, setModalState] = useState({ mode: null, stream: null });
  const [actionError, setActionError] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const openCreateModal = () => {
    setModalState({ mode: 'create', stream: null });
  };

  const openEditModal = (stream) => {
    setModalState({ mode: 'edit', stream });
  };

  const closeModal = () => {
    setModalState({ mode: null, stream: null });
  };

  const handleSaved = async () => {
    await refetch();
    closeModal();
  };

  const handleArchive = async (streamId) => {
    if (!accessToken) {
      return;
    }

    setActionError(null);
    setArchivingId(streamId);

    try {
      await archiveIncomeStream(accessToken, streamId);
      await refetch();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to archive this income stream right now.';
      setActionError(message);
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Income streams"
        description="Predictable inflows help determine how much agency is backed."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add stream
          </button>
        }
      />
      {actionError ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Frequency</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Next expected</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  Loading income streams…
                </td>
              </tr>
            ) : streams.length ? (
              streams.map((stream) => (
                <tr key={stream.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {stream.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {frequencyLabels[stream.frequency] || stream.frequency}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(stream.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(stream.nextExpectedDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(stream)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(stream.id)}
                        disabled={archivingId === stream.id}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {archivingId === stream.id ? 'Archiving…' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No income streams configured yet. Use the “Add stream” button
                  to connect one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <IncomeStreamModal
        open={Boolean(modalState.mode)}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        stream={modalState.stream}
        token={accessToken}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
