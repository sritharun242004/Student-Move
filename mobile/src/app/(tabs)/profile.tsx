import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { getMyAcknowledgment } from '@/lib/renters-rights-api';

function Row({
  title,
  subtitle,
  status,
  onPress,
}: {
  title: string;
  subtitle: string;
  status?: 'done' | 'pending';
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {status === 'done' ? (
        <View style={[styles.pill, styles.pillDone]}>
          <Text style={styles.pillDoneText}>Done</Text>
        </View>
      ) : status === 'pending' ? (
        <View style={[styles.pill, styles.pillPending]}>
          <Text style={styles.pillPendingText}>Action needed</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  const { data: rrAck } = useQuery({
    queryKey: ['renters-rights-ack'],
    queryFn: getMyAcknowledgment,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.note}>Account, tenancy, and compliance.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tenancy compliance</Text>
          <Row
            title="Renters’ Rights Act 2026"
            subtitle={
              rrAck?.acknowledged
                ? 'Acknowledged'
                : 'Required before signing a tenancy agreement'
            }
            status={rrAck?.acknowledged ? 'done' : 'pending'}
            onPress={() => router.push('/renters-rights')}
          />
        </View>

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, gap: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  note: { fontSize: 14, color: '#5f6368' },
  section: { gap: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f7f8fa',
    gap: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  rowSubtitle: { fontSize: 13, color: '#5f6368' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillDone: { backgroundColor: '#e6f4ea' },
  pillDoneText: { color: '#137333', fontSize: 12, fontWeight: '600' },
  pillPending: { backgroundColor: '#fce8e6' },
  pillPendingText: { color: '#b3261e', fontSize: 12, fontWeight: '600' },
  chevron: { fontSize: 22, color: '#9aa0a6' },
  signOut: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: { color: '#b3261e', fontSize: 16, fontWeight: '600' },
});
