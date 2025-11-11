import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import AppLayout from './components/AppLayout.jsx';
import FullScreenLoader from './components/FullScreenLoader.jsx';
import { useAuth } from './providers/AuthProvider.jsx';
import CreditCardsPage from './pages/CreditCardsPage.jsx';
import IncomeStreamsPage from './pages/IncomeStreamsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import PaymentCyclesPage from './pages/PaymentCyclesPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import useHashRoute from './hooks/useHashRoute.js';

const ROUTES = {
  overview: OverviewPage,
  'credit-cards': CreditCardsPage,
  'income-streams': IncomeStreamsPage,
  transactions: TransactionsPage,
  'payment-cycles': PaymentCyclesPage,
};

const DEFAULT_ROUTE = 'overview';
const ROUTE_KEYS = Object.keys(ROUTES);

const RouteRenderer = ({ route }) => {
  const Component = ROUTES[route] || ROUTES[DEFAULT_ROUTE];
  return <Component />;
};

RouteRenderer.propTypes = {
  route: PropTypes.string.isRequired,
};

const initialIncomeStreams = [
  {
    id: 'seed-income-1',
    name: 'Product Design Salary',
    amountCents: 420_000,
    frequency: 'Semi-monthly',
    nextExpectedDate: '2025-11-15',
  },
  {
    id: 'seed-income-2',
    name: 'Freelance UX Retainer',
    amountCents: 120_000,
    frequency: 'Monthly',
    nextExpectedDate: '2025-12-01',
  },
];

const initialTransactions = [
  {
    id: 'seed-transaction-1',
    category: 'Groceries',
    amountCents: -14532,
    merchant: 'Whole Foods',
    transactionDate: '2025-11-01',
  },
  {
    id: 'seed-transaction-2',
    category: 'Salary',
    amountCents: 210000,
    merchant: 'Brightside Studios',
    transactionDate: '2025-11-01',
  },
];

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <header className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </header>
    {children}
  </section>
);

Section.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default function App() {
  const { isAuthenticated, status } = useAuth();
  const [route, navigate] = useHashRoute(DEFAULT_ROUTE, ROUTE_KEYS);

  const handleAuthenticated = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace(/^#/, '');
      if (!currentHash) {
        window.location.hash = `#${route}`;
      }
    }
  }, [isAuthenticated, route]);

  if (status === 'loading') {
    return <FullScreenLoader message="Loading your workspace…" />;
  }

  if (!isAuthenticated) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AppLayout activeRoute={route} onNavigate={navigate}>
      <RouteRenderer route={route} />
    </AppLayout>
  );
}
