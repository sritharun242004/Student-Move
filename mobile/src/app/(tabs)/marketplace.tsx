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

import { listMarketplaceListings, type MarketplaceListing } from '@/lib/marketplace-api';

function ListingCard({ listing, onPress }: { listing: MarketplaceListing; onPress: () => void }) {
  const primary = listing.photos.sort((a, b) => a.displayOrder - b.displayOrder)[0];
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {primary ? (
        <Image source={{ uri: primary.photoUrl }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>No photo</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.price}>£{listing.price}</Text>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {listing.location}
          {listing.category ? ` · ${listing.category.name}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MarketplaceFeed() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['marketplace'],
    queryFn: listMarketplaceListings,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((l) => {
      const hay = `${l.title} ${l.description} ${l.location} ${l.category?.name ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query]);

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
        <Text style={styles.errorTitle}>Couldn’t load marketplace</Text>
        <Text style={styles.errorMsg}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
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
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        renderItem={({ item }) => (
          <View style={styles.column}>
            <ListingCard listing={item} onPress={() => router.push(`/marketplace/${item.id}`)} />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Marketplace</Text>
            <Text style={styles.subheading}>
              {filtered.length} of {data?.length ?? 0} items
            </Text>
            <TextInput
              style={styles.search}
              placeholder="Search items"
              placeholderTextColor="#9aa0a6"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query ? 'No items match your search.' : 'No items listed yet.'}
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
  list: { paddingHorizontal: 12, paddingBottom: 32 },
  header: { paddingTop: 12, paddingBottom: 12, gap: 10, paddingHorizontal: 4 },
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
    marginTop: 4,
  },
  columnWrap: { justifyContent: 'space-between' },
  column: { flexBasis: '48%', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#e8eaed' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: '#9aa0a6', fontSize: 12 },
  body: { padding: 10, gap: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#111' },
  title: { fontSize: 13, color: '#111' },
  meta: { fontSize: 11, color: '#5f6368' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#5f6368' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
