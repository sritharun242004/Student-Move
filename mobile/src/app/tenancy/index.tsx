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

import { listMyLeases, listUtilitiesForLease, type Lease, type Utility } from '@/lib/leases-api';

function UtilityRow({
  utility,
  onPay,
}: {
  utility: Utility;
  onPay: () => void;
}) {
  const isPaid = utility.status === 'paid';
  return (
    <View style={styles.utility}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.utilityAmount}>£{utility.amount}</Text>
        <Text style={styles.utilityMeta}>
          {utility.description ?? 'Utility bill'}
          {utility.dueDate ? ` · due ${new Date(utility.dueDate).toLocaleDateString()}` : ''}
        </Text>
      </View>
      {isPaid ? (
        <View style={[styles.pill, styles.pillDone]}>
          <Text style={styles.pillDoneText}>Paid</Text>
        </View>
      ) : (
        <Pressable style={styles.payBtn} onPress={onPay}>
          <Text style={styles.payBtnText}>Pay</Text>
        </Pressable>
      )}
    </View>
  );
}

function LeaseCard({ lease }: { lease: Lease }) {
  const router = useRouter();
  const { data: utilities, isLoading: utilsLoading } = useQuery({
    queryKey: ['utilities', lease.id],
    queryFn: () => listUtilitiesForLease(lease.id),
  });

  const outstanding = (utilities ?? []).filter((u) => u.status !== 'paid');

  return (
    <View style={styles.leaseCard}>
      <View style={styles.leaseHeader}>
        <Text style={styles.leaseTitle}>
          {lease.propertyObj?.name || lease.propertyObj?.address || `Lease #${lease.id}`}
        </Text>
        <View style={[styles.pill, lease.status === 'active' ? styles.pillActive : styles.pillNeutral]}>
          <Text style={[styles.pillText, lease.status === 'active' && styles.pillActiveText]}>
            {lease.status}
          </Text>
        </View>
      </View>
      {lease.startDate || lease.endDate ? (
        <Text style={styles.leaseMeta}>
          {lease.startDate ?? '—'} → {lease.endDate ?? '—'}
        </Text>
      ) : null}
      {lease.monthlyRent ? <Text style={styles.leaseRent}>£{lease.monthlyRent} / month</Text> : null}

      <Text style={styles.sectionHeader}>Utilities</Text>
      {utilsLoading ? (
        <ActivityIndicator />
      ) : (utilities ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No utility bills yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {(utilities ?? []).map((u) => (
            <UtilityRow key={u.id} utility={u} onPay={() => router.push(`/pay/${u.id}`)} />
          ))}
        </View>
      )}
      {outstanding.length > 0 ? (
        <Text style={styles.outstanding}>
          {outstanding.length} outstanding · £
          {outstanding.reduce((s, u) => s + Number(u.amount || 0), 0).toFixed(2)}
        </Text>
      ) : null}
    </View>
  );
}

export default function TenancyScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['my-leases'],
    queryFn: listMyLeases,
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
        <Text style={styles.errorTitle}>Couldn’t load tenancies</Text>
        <Text style={styles.errorMsg}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'My Tenancies' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={data ?? []}
          keyExtractor={(l) => String(l.id)}
          renderItem={({ item }) => <LeaseCard lease={item} />}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No active tenancies</Text>
              <Text style={styles.emptyBody}>
                Once your application is accepted and a lease is set up, it’ll show here.
              </Text>
              <Pressable style={styles.cta} onPress={() => router.replace('/applications')}>
                <Text style={styles.ctaText}>View my applications</Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  list: { padding: 16, gap: 16 },
  leaseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  leaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaseTitle: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1 },
  leaseMeta: { fontSize: 13, color: '#5f6368' },
  leaseRent: { fontSize: 14, color: '#111', fontWeight: '600' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  utility: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f7f8fa',
    gap: 12,
  },
  utilityAmount: { fontSize: 16, fontWeight: '700', color: '#111' },
  utilityMeta: { fontSize: 12, color: '#5f6368' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillActive: { backgroundColor: '#e6f4ea' },
  pillActiveText: { color: '#137333' },
  pillNeutral: { backgroundColor: '#e8eaed' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#3c4043' },
  pillDone: { backgroundColor: '#e6f4ea' },
  pillDoneText: { color: '#137333', fontSize: 12, fontWeight: '600' },
  payBtn: { backgroundColor: '#208AEF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  outstanding: { marginTop: 8, fontSize: 12, color: '#b06000', fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  emptyBody: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#9aa0a6' },
  cta: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
