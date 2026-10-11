import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(fn, ms, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const refresh = useCallback(() => {
    return fnRef.current()
      .then(result => {
        setData(result);
        setError('');
        return result;
      })
      .catch(error => {
        setError(error.message);
        throw error;
      });
  }, []);

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, ms);

    return () => clearInterval(timer);
  }, [refresh, ms, ...deps]);

  return {
    data,
    error,
    refresh
  };
}