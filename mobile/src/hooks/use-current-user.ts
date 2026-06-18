import { useEffect, useState } from 'react';

import type { AuthUser } from '@/lib/auth-api';
import { getStoredUser } from '@/lib/auth-storage';

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStoredUser<AuthUser>().then((u) => {
      if (cancelled) return;
      setUser(u);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, setUser, loaded };
}
