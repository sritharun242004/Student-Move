import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'studentmoves.onboarding.completed.v1';

export async function getOnboardingCompleted(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === '1';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}
