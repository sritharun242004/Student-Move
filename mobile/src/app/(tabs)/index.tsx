import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFavorites } from '@/hooks/use-favorites';
import { listProperties, type Property, resolveImageUrl } from '@/lib/properties-api';

type FeedView = 'all' | 'saved';
type BedFilter = 'any' | 1 | 2 | 3 | 4;

const BED_OPTIONS: { label: string; value: BedFilter }[] = [
  { label: 'Any', value: 'any' },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4+', value: 4 },
];

function HeartButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.heart}
      hitSlop={10}
      accessibilityLabel={active ? 'Remove from saved' : 'Save property'}>
      <Text style={[styles.heartIcon, active && styles.heartIconActive]}>{active ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
}: {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const router = useRouter();
  const imageUrl = resolveImageUrl(property.images[0]?.image);
  const title = property.name?.trim() || property.address;
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/property/${property.id}`)}>
      <View>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>No photo</Text>
          </View>
        )}
        <HeartButton active={isFavorite} onPress={onToggleFavorite} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.price}>
          £{property.price}
          <Text style={styles.priceUnit}> /month</Text>
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {property.address}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaItem}>{property.rooms} bed</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>{property.bathrooms} bath</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>EPC {property.epcRating}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PropertiesFeed() {
  const [view, setView] = useState<FeedView>('all');
  const [bedFilter, setBedFilter] = useState<BedFilter>('any');
  const [query, setQuery] = useState('');
  const { isFavorite, toggle } = useFavorites();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['properties'],
    queryFn: listProperties,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((p) => {
      if (view === 'saved' && !isFavorite(p.id)) return false;
      if (bedFilter !== 'any') {
        if (bedFilter === 4 ? p.rooms < 4 : p.rooms !== bedFilter) return false;
      }
      if (q) {
        const haystack = `${p.name ?? ''} ${p.address} ${p.zipCode ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [data, view, bedFilter, query, isFavorite]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load properties</Text>
        <Text style={styles.errorMsg}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <Pressable style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggle(item.id)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Find your next place</Text>
            <Text style={styles.subheading}>
              {filtered.length} of {data?.length ?? 0} properties
            </Text>

            <TextInput
              style={styles.search}
              placeholder="Search city, postcode or property name"
              placeholderTextColor="#9aa0a6"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            <View style={styles.segmented}>
              {(['all', 'saved'] as FeedView[]).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.segItem, view === v && styles.segItemActive]}
                  onPress={() => setView(v)}>
                  <Text style={[styles.segText, view === v && styles.segTextActive]}>
                    {v === 'all' ? 'All' : 'Saved'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.chipRow}>
              {BED_OPTIONS.map((opt) => {
                const active = bedFilter === opt.value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => setBedFilter(opt.value)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label === 'Any' ? 'Any beds' : `${opt.label} bed${opt.value === 1 ? '' : 's'}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {view === 'saved'
                ? 'You haven’t saved any properties yet.'
                : query || bedFilter !== 'any'
                  ? 'No properties match your filters.'
                  : 'No properties listed yet.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { paddingTop: 12, paddingBottom: 16, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111' },
  subheading: { fontSize: 13, color: '#5f6368' },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#e8eaed',
    borderRadius: 10,
    padding: 3,
  },
  segItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segItemActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 14, color: '#5f6368', fontWeight: '500' },
  segTextActive: { color: '#111', fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  chipText: { fontSize: 13, color: '#3c4043' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: '100%', height: 200, backgroundColor: '#e8eaed' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: '#9aa0a6' },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  heartIcon: { fontSize: 20, color: '#5f6368' },
  heartIconActive: { color: '#e53935' },
  cardBody: { padding: 14, gap: 4 },
  price: { fontSize: 18, fontWeight: '700', color: '#111' },
  priceUnit: { fontSize: 13, fontWeight: '400', color: '#5f6368' },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  address: { fontSize: 14, color: '#5f6368' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  metaItem: { fontSize: 13, color: '#3c4043' },
  metaDot: { color: '#9aa0a6' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#5f6368', textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
