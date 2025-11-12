import PropTypes from 'prop-types';

import { useAuth } from '../providers/AuthProvider.jsx';

const navigation = [
  { id: 'overview', label: 'Overview' },
  { id: 'credit-cards', label: 'Credit Cards' },
  { id: 'income-streams', label: 'Income Streams' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'payment-cycles', label: 'Payment Cycles' },
  { id: 'category-budgets', label: 'Category Budgets' },
  { id: 'savings-goals', label: 'Savings Goals' },
  { id: 'projected-expenses', label: 'Projected Expenses' },
];

const variantStyles = {
  sidebar: {
    base: 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-800/50',
    active: 'bg-slate-800 text-white',
    inactive: 'text-slate-200',
  },
  mobile: {
    base: 'flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition',
    active: 'bg-slate-900 text-white shadow-sm',
    inactive: 'bg-slate-100 text-slate-700',
  },
};

const NavItem = ({ id, label, isActive, onSelect, variant = 'sidebar' }) => (
  <button
    type="button"
    onClick={() => onSelect(id)}
    className={`${variantStyles[variant].base} ${
      isActive ? variantStyles[variant].active : variantStyles[variant].inactive
    }`}
  >
    {label}
  </button>
);

NavItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['sidebar', 'mobile']),
};

NavItem.defaultProps = {
  isActive: false,
  variant: 'sidebar',
};

export default function AppLayout({ activeRoute, onNavigate, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 flex-col justify-between bg-slate-900 px-4 py-6 md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Family Finance Tracker
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                Adult Workspace
              </p>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.id}
                  {...item}
                  isActive={item.id === activeRoute}
                  onSelect={onNavigate}
                />
              ))}
            </nav>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">
              {user?.firstName || user?.email}
            </p>
            <p className="text-xs text-slate-400">{user?.role?.name}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Family Finance Tracker
                </p>
                <p className="text-xl font-bold text-slate-900 md:text-2xl">
                  Adult Workspace
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-sm md:block">
                  <p className="font-semibold text-slate-900">
                    {user?.firstName || user?.email}
                  </p>
                  <p className="text-xs text-slate-500">{user?.role?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 md:inline-flex"
                >
                  Sign out
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 md:hidden"
                >
                  Sign out
                </button>
              </div>
            </div>
            <nav className="grid gap-2 md:hidden">
              <div className="grid grid-cols-2 gap-2">
                {navigation.slice(0, 2).map((item) => (
                  <NavItem
                    key={item.id}
                    {...item}
                    variant="mobile"
                    isActive={item.id === activeRoute}
                    onSelect={onNavigate}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {navigation.slice(2).map((item) => (
                  <NavItem
                    key={item.id}
                    {...item}
                    variant="mobile"
                    isActive={item.id === activeRoute}
                    onSelect={onNavigate}
                  />
                ))}
              </div>
            </nav>
          </header>
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  activeRoute: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
