'use client';

import { useEffect, useState, useCallback } from 'react';

/** Small client-side data hook shared by every dashboard view — fetches `url`, exposes
 * {data, loading, error, notFound, reload}. `notFound` distinguishes "no data yet" (404, e.g.
 * a Member who hasn't created their company) from a real error, so views can render an
 * empty/setup state instead of an error banner. */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    fetch(url)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setData(null);
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Erro ao carregar dados.');
        setData(body);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Erro ao carregar dados.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [url, reloadKey]);

  return { data, loading, error, notFound, reload };
}
