import PropTypes from 'prop-types';

const toneStyles = {
  primary: 'bg-blue-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export default function ProgressBar({ percent, tone, label }) {
  const clamped = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, Math.round(percent)))
    : 0;
  const barTone = toneStyles[tone] || toneStyles.primary;

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-2 transition-all duration-300 ${barTone}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{clamped}% funded</p>
    </div>
  );
}

ProgressBar.propTypes = {
  percent: PropTypes.number,
  tone: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  label: PropTypes.string,
};

ProgressBar.defaultProps = {
  percent: 0,
  tone: 'primary',
  label: undefined,
};
