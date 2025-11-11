import PropTypes from 'prop-types';

export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
};
