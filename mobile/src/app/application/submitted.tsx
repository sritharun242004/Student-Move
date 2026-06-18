import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ApplicationSubmitted() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Submitted', headerBackVisible: false }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <View style={styles.checkBubble}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.title}>Application submitted</Text>
          <Text style={styles.body}>
            We’ve received your application. Next, you’ll need to upload your ID document, add a
            guarantor, acknowledge the Renters’ Rights Information, and sign the tenancy
            agreement. You can do these from My Applications.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.primary}
              onPress={() => router.replace('/applications')}>
              <Text style={styles.primaryText}>Go to My Applications</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.secondaryText}>Back to browse</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  checkBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 36, color: '#137333', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  body: { fontSize: 14, color: '#5f6368', textAlign: 'center', lineHeight: 21 },
  actions: { width: '100%', gap: 10, marginTop: 16 },
  primary: { backgroundColor: '#208AEF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: {
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#3c4043', fontSize: 15, fontWeight: '600' },
});
