import { useQuery } from '../hooks/useQuery';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { fetchIncomeStreams } from '../api/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

const frequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  semimonthly: 'Semi-monthly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

export default function IncomeStreamsPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['incomeStreams', accessToken],
    queryFn: () => fetchIncomeStreams(accessToken),
    enabled: Boolean(accessToken),
  });

  const streams = data?.incomeStreams ?? [];

  return (
    <div>
      <PageHeader
        title="Income streams"
        description="Predictable inflows help determine how much agency is backed."
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Frequency</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Next expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={4}>
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
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={4}>
                  No income streams configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
