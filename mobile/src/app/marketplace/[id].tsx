import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMarketplaceListing, type MarketplaceListing } from '@/lib/marketplace-api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Gallery({ listing }: { listing: MarketplaceListing }) {
  const [index, setIndex] = useState(0);
  const photos = [...listing.photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const displayPhotos = photos.length > 0 ? photos : [{ id: 'none', photoUrl: '', displayOrder: 0 }];

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={displayPhotos}
        keyExtractor={(p) => p.id}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item }) =>
          item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.galleryImage} contentFit="cover" />
          ) : (
            <View style={[styles.galleryImage, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>No photo</Text>
            </View>
          )
        }
      />
      {displayPhotos.length > 1 ? (
        <View style={styles.dots}>
          {displayPhotos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function MarketplaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: listing, isLoading, isError, error } = useQuery({
    queryKey: ['marketplace-listing', id],
    queryFn: () => getMarketplaceListing(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  if (isError || !listing) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load listing</Text>
        <Text style={styles.errorMsg}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable style={styles.retry} onPress={() => router.back()}>
          <Text style={styles.retryText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const call = () => {
    if (listing.contactNumber) {
      Linking.openURL(`tel:${listing.contactNumber}`).catch(() => {});
    }
  };
  const whatsapp = () => {
    if (listing.contactNumber) {
      const clean = listing.contactNumber.replace(/[^\d+]/g, '');
      const url = `https://wa.me/${clean.replace(/^\+/, '')}?text=${encodeURIComponent(
        `Hi, I'm interested in your Student Moves listing: "${listing.title}"`,
      )}`;
      WebBrowser.openBrowserAsync(url).catch(() => {});
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView>
          <Gallery listing={listing} />

          <View style={styles.body}>
            <Text style={styles.price}>£{listing.price}</Text>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.meta}>
              {listing.location}
              {listing.category ? ` · ${listing.category.name}` : ''}
            </Text>

            {listing.sellerProfile ? (
              <View style={styles.sellerRow}>
                <View style={styles.avatar}>
                  {listing.sellerProfile.profilePhotoUrl ? (
                    <Image
                      source={{ uri: listing.sellerProfile.profilePhotoUrl }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {listing.sellerProfile.displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{listing.sellerProfile.displayName}</Text>
                  <Text style={styles.sellerMeta}>Seller</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        </ScrollView>

        {listing.contactNumber ? (
          <View style={styles.actionBar}>
            <Pressable style={styles.secondaryBtn} onPress={call}>
              <Text style={styles.secondaryText}>Call</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={whatsapp}>
              <Text style={styles.primaryText}>Message on WhatsApp</Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  galleryImage: { width: SCREEN_WIDTH, height: 320, backgroundColor: '#e8eaed' },
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
  price: { fontSize: 26, fontWeight: '700', color: '#111' },
  title: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 2 },
  meta: { fontSize: 14, color: '#5f6368' },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f7f8fa',
    marginTop: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44 },
  avatarText: { color: '#208AEF', fontWeight: '700', fontSize: 18 },
  sellerName: { fontSize: 15, fontWeight: '600', color: '#111' },
  sellerMeta: { fontSize: 12, color: '#5f6368' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginTop: 18,
    marginBottom: 4,
  },
  description: { fontSize: 14, color: '#3c4043', lineHeight: 21 },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  secondaryText: { color: '#3c4043', fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
