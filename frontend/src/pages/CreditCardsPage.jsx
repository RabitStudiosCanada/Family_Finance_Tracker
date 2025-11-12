import { useCallback, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';

import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import Modal from '../components/Modal.jsx';
import { ApiError } from '../api/client';
import {
  fetchCreditCards,
  createCreditCard,
  updateCreditCard,
  archiveCreditCard,
} from '../api/finance';
import { formatCurrency } from '../utils/formatters';

const initialFormState = (card) => ({
  nickname: card?.nickname ?? '',
  issuer: card?.issuer ?? '',
  lastFour: card?.lastFour ?? '',
  creditLimit: card?.creditLimitCents
    ? String(card.creditLimitCents / 100)
    : '',
  cycleAnchorDay: card?.cycleAnchorDay ? String(card.cycleAnchorDay) : '1',
  statementDay: card?.statementDay ? String(card.statementDay) : '1',
  paymentDueDay: card?.paymentDueDay ? String(card.paymentDueDay) : '1',
  autopayEnabled: Boolean(card?.autopayEnabled),
});

const parseDay = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) {
    return null;
  }

  return parsed;
};

const creditCardPropType = PropTypes.shape({
  id: PropTypes.string,
  nickname: PropTypes.string,
  issuer: PropTypes.string,
  lastFour: PropTypes.string,
  creditLimitCents: PropTypes.number,
  cycleAnchorDay: PropTypes.number,
  statementDay: PropTypes.number,
  paymentDueDay: PropTypes.number,
  autopayEnabled: PropTypes.bool,
});

function CreditCardModal({ open, mode, card, token, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialFormState(card));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const formId = useId();

  const resetState = useCallback(() => {
    setForm(initialFormState(card));
    setStatus('idle');
    setError(null);
  }, [card]);

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

    const nickname = form.nickname.trim();

    if (!nickname) {
      setStatus('error');
      setError('Nickname is required.');
      return;
    }

    const creditLimitValue = Number.parseFloat(form.creditLimit);

    if (!Number.isFinite(creditLimitValue) || creditLimitValue <= 0) {
      setStatus('error');
      setError('Enter a positive credit limit.');
      return;
    }

    const cycleAnchorDay = parseDay(form.cycleAnchorDay);
    const statementDay = parseDay(form.statementDay);
    const paymentDueDay = parseDay(form.paymentDueDay);

    if (!cycleAnchorDay || !statementDay || !paymentDueDay) {
      setStatus('error');
      setError('Billing cycle days must be between 1 and 31.');
      return;
    }

    const lastFour = form.lastFour.trim();

    if (lastFour && !/^[0-9]{4}$/u.test(lastFour)) {
      setStatus('error');
      setError('Last four digits must be four numbers.');
      return;
    }

    setStatus('submitting');
    setError(null);

    const payload = {
      nickname,
      issuer: form.issuer.trim() || undefined,
      lastFour: lastFour || undefined,
      creditLimitCents: Math.round(creditLimitValue * 100),
      cycleAnchorDay,
      statementDay,
      paymentDueDay,
      autopayEnabled: form.autopayEnabled,
    };

    try {
      if (mode === 'edit' && card) {
        await updateCreditCard(token, card.id, payload);
      } else {
        await createCreditCard(token, payload);
        resetState();
      }

      setStatus('success');
      onSaved?.();
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to save this credit card right now.';
      setStatus('error');
      setError(message);
    }
  };

  const modalTitle = mode === 'edit' ? 'Edit credit card' : 'Add credit card';

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
            {isSubmitting ? 'Saving…' : 'Save card'}
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
            <span className="mb-1 block font-medium text-slate-700">
              Nickname
            </span>
            <input
              type="text"
              name="nickname"
              required
              maxLength={120}
              value={form.nickname}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Issuer
            </span>
            <input
              type="text"
              name="issuer"
              maxLength={120}
              value={form.issuer}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Last four
            </span>
            <input
              type="text"
              name="lastFour"
              pattern="[0-9]{4}"
              maxLength={4}
              value={form.lastFour}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1234"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Credit limit (CAD)
            </span>
            <input
              type="number"
              name="creditLimit"
              min="0"
              step="0.01"
              required
              value={form.creditLimit}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Cycle anchor day
            </span>
            <input
              type="number"
              name="cycleAnchorDay"
              min="1"
              max="31"
              required
              value={form.cycleAnchorDay}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Statement day
            </span>
            <input
              type="number"
              name="statementDay"
              min="1"
              max="31"
              required
              value={form.statementDay}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Payment due day
            </span>
            <input
              type="number"
              name="paymentDueDay"
              min="1"
              max="31"
              required
              value={form.paymentDueDay}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="autopayEnabled"
            checked={form.autopayEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Autopay enabled
        </label>
      </form>
    </Modal>
  );
}

CreditCardModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  card: creditCardPropType,
  token: PropTypes.string,
  onClose: PropTypes.func,
  onSaved: PropTypes.func,
};

export default function CreditCardsPage() {
  const { accessToken } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['creditCards', accessToken],
    queryFn: () => fetchCreditCards(accessToken),
    enabled: Boolean(accessToken),
  });

  const cards = data?.creditCards ?? [];
  const [modalState, setModalState] = useState({ mode: null, card: null });
  const [actionError, setActionError] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const openCreateModal = () => {
    setModalState({ mode: 'create', card: null });
  };

  const openEditModal = (card) => {
    setModalState({ mode: 'edit', card });
  };

  const closeModal = () => {
    setModalState({ mode: null, card: null });
  };

  const handleSaved = async () => {
    await refetch();
    closeModal();
  };

  const handleArchive = async (cardId) => {
    if (!accessToken) {
      return;
    }

    setActionError(null);
    setArchivingId(cardId);

    try {
      await archiveCreditCard(accessToken, cardId);
      await refetch();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to archive this credit card right now.';
      setActionError(message);
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Credit cards"
        description="Review active cards and the details used to calculate your agency."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add card
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
              <th className="px-4 py-3 font-medium">Nickname</th>
              <th className="px-4 py-3 font-medium">Issuer</th>
              <th className="px-4 py-3 font-medium">Last four</th>
              <th className="px-4 py-3 font-medium">Credit limit</th>
              <th className="px-4 py-3 font-medium">Autopay</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={6}>
                  Loading credit cards…
                </td>
              </tr>
            ) : cards.length ? (
              cards.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {card.nickname}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {card.issuer}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {card.lastFour || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {formatCurrency(card.creditLimitCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {card.autopayEnabled ? 'Enabled' : 'Manual'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(card)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(card.id)}
                        disabled={archivingId === card.id}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {archivingId === card.id ? 'Archiving…' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={6}>
                  No credit cards yet. Use the “Add card” button to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreditCardModal
        open={Boolean(modalState.mode)}
        mode={modalState.mode === 'edit' ? 'edit' : 'create'}
        card={modalState.card}
        token={accessToken}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
