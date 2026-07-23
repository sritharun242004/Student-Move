import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';

import { listPublicReels, type Reel } from '@/lib/reels-api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ReelItem({ reel, active }: { reel: Reel; active: boolean }) {
  const player = useVideoPlayer(reel.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <View style={styles.reelContainer}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay}>
        <View style={styles.bottom}>
          <View style={styles.creatorRow}>
            <View style={styles.avatar}>
              {reel.creator.profilePhotoUrl ? (
                <Image
                  source={{ uri: reel.creator.profilePhotoUrl }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {reel.creator.displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.creatorName}>{reel.creator.displayName}</Text>
          </View>
          {reel.caption ? <Text style={styles.caption}>{reel.caption}</Text> : null}
          {reel.tags.length > 0 ? (
            <Text style={styles.tags}>{reel.tags.map((t) => `#${t}`).join(' ')}</Text>
          ) : null}
        </View>

        <View style={styles.actionsRight}>
          <View style={styles.actionBtn}>
            <Text style={styles.actionIcon}>♡</Text>
            <Text style={styles.actionCount}>{reel.likesCount}</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{reel.commentsCount}</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionCount}>{reel.sharesCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ReelsFeed() {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reels-public-feed'],
    queryFn: listPublicReels,
  });

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load reels</Text>
        <Text style={styles.errorMsg}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <Pressable style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorMsg}>No reels yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(r) => r.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      renderItem={({ item, index }) => (
        <ReelItem reel={item} active={index === activeIndex} />
      )}
      getItemLayout={(_, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  bottom: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
    paddingRight: 70,
    gap: 6,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarImg: { width: 36, height: 36 },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  caption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  tags: { color: '#fff', fontSize: 13, opacity: 0.8, marginTop: 4 },
  actionsRight: {
    width: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
    gap: 20,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 30, color: '#fff' },
  actionCount: { fontSize: 12, color: '#fff', fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  errorMsg: { fontSize: 14, color: '#dadce0', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
