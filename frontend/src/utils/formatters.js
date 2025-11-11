const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
});

export const formatCurrency = (value) =>
  currencyFormatter.format((value ?? 0) / 100);

export const formatDate = (value, fallback = '—') => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeDays = (days) => {
  if (days === null || days === undefined) {
    return '—';
  }

  if (days === 0) {
    return 'Today';
  }

  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  }

  return `In ${days} days`;
};
