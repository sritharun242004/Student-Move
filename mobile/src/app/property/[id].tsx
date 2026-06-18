import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProperty, resolveImageUrl, type Property } from '@/lib/properties-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Gallery({ property }: { property: Property }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = property.images.length > 0 ? property.images : [{ id: 0, image: '' }];

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={images}
        keyExtractor={(img) => String(img.id)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => {
          const url = resolveImageUrl(item.image);
          return url ? (
            <Image source={{ uri: url }} style={styles.galleryImage} contentFit="cover" />
          ) : (
            <View style={[styles.galleryImage, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>No photo</Text>
            </View>
          );
        }}
      />
      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
    </View>
  );
}

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: property, isLoading, isError, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !property) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load this property</Text>
        <Text style={styles.errorMsg}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable style={styles.retry} onPress={() => router.back()}>
          <Text style={styles.retryText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const title = property.name?.trim() || property.address;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView>
          <Gallery property={property} />

          <View style={styles.body}>
            <Text style={styles.price}>£{property.price}<Text style={styles.priceUnit}> /month</Text></Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.address}>{property.address}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statNum}>{property.rooms}</Text><Text style={styles.statLabel}>Bedrooms</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>{property.bathrooms}</Text><Text style={styles.statLabel}>Bathrooms</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>{property.epcRating}</Text><Text style={styles.statLabel}>EPC</Text></View>
            </View>

            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description}</Text>

            <Text style={styles.sectionTitle}>Details</Text>
            <Detail label="Postcode" value={property.zipCode} />
            <Detail label="Available from" value={property.availableAfter} />
            <Detail label="Available to" value={property.availableTo} />
          </View>
        </ScrollView>

        <View style={styles.actionBar}>
          <Pressable style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply for this property</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  galleryImage: { width: SCREEN_WIDTH, height: 280, backgroundColor: '#e8eaed' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: '#9aa0a6' },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { padding: 20, gap: 8 },
  price: { fontSize: 24, fontWeight: '700', color: '#111' },
  priceUnit: { fontSize: 14, fontWeight: '400', color: '#5f6368' },
  title: { fontSize: 20, fontWeight: '600', color: '#111', marginTop: 4 },
  address: { fontSize: 15, color: '#5f6368' },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 12, color: '#5f6368' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginTop: 20, marginBottom: 4 },
  description: { fontSize: 14, color: '#3c4043', lineHeight: 21 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: '#5f6368' },
  detailValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  actionBar: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
  },
  applyButton: { backgroundColor: '#208AEF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
