import PropTypes from 'prop-types';

export default function FullScreenLoader({
  message = 'Loading your workspace…',
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}

FullScreenLoader.propTypes = {
  message: PropTypes.string,
};
