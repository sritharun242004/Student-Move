import { useCallback, useEffect, useState } from 'react';

import { getOnboardingCompleted, setOnboardingCompleted } from '@/lib/onboarding-storage';

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingCompleted().then(setCompleted);
  }, []);

  const complete = useCallback(async () => {
    await setOnboardingCompleted();
    setCompleted(true);
  }, []);

  return { completed, complete };
}
