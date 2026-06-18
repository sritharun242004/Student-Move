import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'studentmoves.favorites.v1';

export async function getFavoriteIds(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

export async function setFavoriteIds(ids: number[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids));
}
