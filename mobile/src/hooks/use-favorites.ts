import { useCallback, useEffect, useState } from 'react';

import { getFavoriteIds, setFavoriteIds } from '@/lib/favorites';

export function useFavorites() {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getFavoriteIds().then((list) => {
      setIds(new Set(list));
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: Set<number>) => {
    setIds(next);
    await setFavoriteIds(Array.from(next));
  }, []);

  const toggle = useCallback(
    async (id: number) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      await persist(next);
    },
    [ids, persist],
  );

  const isFavorite = useCallback((id: number) => ids.has(id), [ids]);

  return { ids, isFavorite, toggle, loaded };
}
