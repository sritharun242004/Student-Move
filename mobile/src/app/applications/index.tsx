import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listMyApplications, type Application } from '@/lib/applications-api';

function Card({ app, onPress }: { app: Application; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.appType}>{app.status}</Text>
        <View style={[styles.badge, app.isCompleted ? styles.badgeDone : styles.badgePending]}>
          <Text style={[styles.badgeText, app.isCompleted ? styles.badgeDoneText : styles.badgePendingText]}>
            {app.isCompleted ? 'Submitted' : 'In progress'}
          </Text>
        </View>
      </View>
      <Text style={styles.propertyLine}>Property #{app.property}</Text>
      <View style={styles.metaRow}>
        {app.startDate ? <Text style={styles.metaItem}>Move-in: {app.startDate}</Text> : null}
        {app.creditCheck !== 'Default' ? (
          <Text style={styles.metaItem}>Credit: {app.creditCheck}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ApplicationsList() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['my-applications'],
    queryFn: listMyApplications,
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'My Applications' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Couldn’t load applications</Text>
            <Text style={styles.errorMsg}>
              {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
            <Pressable style={styles.retry} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(a) => String(a.id)}
            renderItem={({ item }) => (
              <Card app={item} onPress={() => router.push(`/property/${item.property}`)} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptyBody}>
                  Browse properties and tap Apply to start your first application.
                </Text>
                <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.ctaText}>Browse properties</Text>
                </Pressable>
              </View>
            }
            contentContainerStyle={styles.list}
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appType: { fontSize: 15, fontWeight: '600', color: '#111' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeDone: { backgroundColor: '#e6f4ea' },
  badgePending: { backgroundColor: '#fff4e5' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeDoneText: { color: '#137333' },
  badgePendingText: { color: '#b06000' },
  propertyLine: { fontSize: 14, color: '#5f6368' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { fontSize: 12, color: '#5f6368' },
  empty: { padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  emptyBody: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  cta: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
