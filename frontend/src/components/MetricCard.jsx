import PropTypes from 'prop-types';

export default function MetricCard({ label, value, hint, tone = 'default' }) {
  const toneClasses = {
    default: 'border-slate-200 bg-white text-slate-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
  };

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${
        toneClasses[tone] || toneClasses.default
      }`}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
};
