import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { fetchCreditCards } from '../api/finance';
import { formatCurrency } from '../utils/formatters';

export default function CreditCardsPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['creditCards', accessToken],
    queryFn: () => fetchCreditCards(accessToken),
    enabled: Boolean(accessToken),
  });

  const cards = data?.creditCards ?? [];

  return (
    <div>
      <PageHeader
        title="Credit cards"
        description="Review active cards and the details used to calculate your agency."
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nickname</th>
              <th className="px-4 py-3 font-medium">Issuer</th>
              <th className="px-4 py-3 font-medium">Last four</th>
              <th className="px-4 py-3 font-medium">Credit limit</th>
              <th className="px-4 py-3 font-medium">Autopay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
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
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No credit cards yet. Use the API to add one and it will appear
                  here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
