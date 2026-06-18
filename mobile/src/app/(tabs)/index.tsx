import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listProperties, type Property, resolveImageUrl } from '@/lib/properties-api';

function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const imageUrl = resolveImageUrl(property.images[0]?.image);
  const title = property.name?.trim() || property.address;
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/property/${property.id}`)}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>No photo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.price}>£{property.price}<Text style={styles.priceUnit}> /month</Text></Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.address} numberOfLines={1}>{property.address}</Text>
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
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['properties'],
    queryFn: listProperties,
  });

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
        data={data ?? []}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <PropertyCard property={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Find your next place</Text>
            <Text style={styles.subheading}>{data?.length ?? 0} properties available</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No properties listed yet.</Text>
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
  header: { paddingTop: 12, paddingBottom: 16, gap: 4 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111' },
  subheading: { fontSize: 14, color: '#5f6368' },
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
  cardBody: { padding: 14, gap: 4 },
  price: { fontSize: 18, fontWeight: '700', color: '#111' },
  priceUnit: { fontSize: 13, fontWeight: '400', color: '#5f6368' },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  address: { fontSize: 14, color: '#5f6368' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  metaItem: { fontSize: 13, color: '#3c4043' },
  metaDot: { color: '#9aa0a6' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#5f6368' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
