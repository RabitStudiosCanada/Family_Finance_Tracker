import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const createInitialState = (enabled) => ({
  data: undefined,
  error: null,
  status: enabled ? 'loading' : 'idle',
  isLoading: enabled,
  isFetching: false,
});

const normalizeKey = (queryKey) => {
  if (!queryKey) {
    return 'default';
  }

  if (Array.isArray(queryKey)) {
    return JSON.stringify(queryKey);
  }

  return String(queryKey);
};

export const useQuery = ({ queryKey, queryFn, enabled = true }) => {
  const [state, setState] = useState(() => createInitialState(enabled));
  const keySignature = useMemo(() => normalizeKey(queryKey), [queryKey]);
  const fetchRef = useRef();

  fetchRef.current = queryFn;

  const execute = useCallback(async () => {
    if (!enabled) {
      setState((previous) => ({
        ...previous,
        status: 'idle',
        isLoading: false,
        isFetching: false,
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      status: previous.status === 'success' ? 'success' : 'loading',
      isLoading: previous.status !== 'success',
      isFetching: true,
      error: null,
    }));

    try {
      const result = await fetchRef.current();

      setState({
        data: result,
        error: null,
        status: 'success',
        isLoading: false,
        isFetching: false,
      });
    } catch (error) {
      setState({
        data: undefined,
        error,
        status: 'error',
        isLoading: false,
        isFetching: false,
      });
    }
  }, [enabled]);

  useEffect(() => {
    execute();
  }, [execute, keySignature]);

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    refetch: execute,
  };
};
