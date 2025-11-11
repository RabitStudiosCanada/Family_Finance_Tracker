import { useCallback, useEffect, useState } from 'react';

const normalizeRoute = (route, fallback, allowed) => {
  if (!route) {
    return fallback;
  }

  if (allowed.length && !allowed.includes(route)) {
    return fallback;
  }

  return route;
};

const readInitialRoute = (fallback, allowed) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const current = window.location.hash.replace(/^#/, '');
  return normalizeRoute(current, fallback, allowed);
};

export default function useHashRoute(fallbackRoute, allowedRoutes = []) {
  const [route, setRoute] = useState(() =>
    readInitialRoute(fallbackRoute, allowedRoutes)
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleHashChange = () => {
      setRoute(
        normalizeRoute(
          window.location.hash.replace(/^#/, ''),
          fallbackRoute,
          allowedRoutes
        )
      );
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [allowedRoutes, fallbackRoute]);

  const navigate = useCallback(
    (nextRoute) => {
      const normalized = normalizeRoute(
        nextRoute,
        fallbackRoute,
        allowedRoutes
      );
      setRoute(normalized);

      if (typeof window !== 'undefined') {
        const nextHash = `#${normalized}`;

        if (window.location.hash !== nextHash) {
          window.location.hash = nextHash;
        }
      }
    },
    [allowedRoutes, fallbackRoute]
  );

  return [route, navigate];
}
