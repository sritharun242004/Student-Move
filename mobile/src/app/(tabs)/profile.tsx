import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getMyAcknowledgment } from '@/lib/renters-rights-api';

function Avatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials || '·'}</Text>
    </View>
  );
}

function Row({
  title,
  subtitle,
  status,
  onPress,
}: {
  title: string;
  subtitle?: string;
  status?: 'done' | 'pending';
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
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
  const { user } = useCurrentUser();

  const { data: rrAck } = useQuery({
    queryKey: ['renters-rights-ack'],
    queryFn: getMyAcknowledgment,
  });

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const initials =
    `${(user?.firstName?.[0] ?? '').toUpperCase()}${(user?.lastName?.[0] ?? '').toUpperCase()}` || '·';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.identity}>
          <Avatar initials={initials} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName || 'Your profile'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            {user?.profile?.phone ? (
              <Text style={styles.phone}>{user.profile.phone}</Text>
            ) : null}
          </View>
          <Pressable style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tenancy compliance</Text>
          <Row
            title="Renters' Rights Act 2026"
            subtitle={
              rrAck?.acknowledged
                ? 'Acknowledged'
                : 'Required before signing a tenancy agreement'
            }
            status={rrAck?.acknowledged ? 'done' : 'pending'}
            onPress={() => router.push('/renters-rights')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>App</Text>
          <Row title="Settings" onPress={() => router.push('/settings')} />
        </View>

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#208AEF' },
  name: { fontSize: 20, fontWeight: '700', color: '#111' },
  email: { fontSize: 14, color: '#5f6368' },
  phone: { fontSize: 13, color: '#5f6368' },
  editBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editText: { fontSize: 13, color: '#208AEF', fontWeight: '600' },
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
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: { color: '#b3261e', fontSize: 16, fontWeight: '600' },
});
