import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { queryClient } from '@/lib/query-client';

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { completed: onboardingCompleted } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === null || onboardingCompleted === null) return;

    const atOnboarding = segments[0] === 'onboarding';
    const inAuthGroup = segments[0] === '(auth)';

    if (!onboardingCompleted && !atOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (onboardingCompleted && atOnboarding) {
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/sign-in');
      return;
    }
    if (onboardingCompleted && !isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (onboardingCompleted && isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, onboardingCompleted, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
