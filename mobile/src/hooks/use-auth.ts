import { useCallback, useEffect, useState } from 'react';

import { clearTokens, getAccessToken } from '@/lib/auth-storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const token = await getAccessToken();
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, refresh, signOut };
}
