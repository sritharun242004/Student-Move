import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '@/hooks/use-onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  emoji: string;
  title: string;
  body: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    emoji: '🏠',
    title: 'Find your next student home',
    body: 'Browse verified properties across UK university cities. Filter by rooms, save favourites, apply in the app.',
    accent: '#208AEF',
  },
  {
    emoji: '📄',
    title: 'Apply in minutes',
    body: 'One tap to start an application. Upload your ID, add your guarantor, and track progress in one place.',
    accent: '#137333',
  },
  {
    emoji: '✍️',
    title: 'Sign safely, know your rights',
    body: 'Every tenancy comes with a Renters’ Rights Act 2026 information sheet. Read it, acknowledge it, then sign your agreement — all inside the app.',
    accent: '#b06000',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { complete } = useOnboarding();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      finish();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const finish = async () => {
    await complete();
    router.replace('/(auth)/sign-in');
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(i);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.emojiWrap, { backgroundColor: `${item.accent}15` }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && [styles.dotActive, { backgroundColor: SLIDES[index]?.accent }],
                ]}
              />
            ))}
          </View>
          <Pressable
            style={[styles.cta, { backgroundColor: SLIDES[index]?.accent }]}
            onPress={goNext}>
            <Text style={styles.ctaText}>{isLast ? 'Get started' : 'Next'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skip: { fontSize: 15, color: '#5f6368', fontWeight: '500' },
  slide: { paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', gap: 20 },
  emojiWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 84 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginTop: 12,
  },
  body: {
    fontSize: 15,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: { padding: 24, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e8eaed' },
  dotActive: { width: 24 },
  cta: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
