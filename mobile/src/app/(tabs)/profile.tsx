import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.note}>
          Your account, application progress and tenancy details will live here.
        </Text>

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  note: { fontSize: 14, color: '#5f6368', lineHeight: 20 },
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
