import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/hooks/use-current-user';
import { updateProfile } from '@/lib/profile-api';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser, loaded } = useCurrentUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  const dirty =
    user &&
    (firstName !== (user.firstName ?? '') ||
      lastName !== (user.lastName ?? '') ||
      email !== (user.email ?? ''));

  const onSave = async () => {
    if (!dirty) return;
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setUser(updated);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Edit profile' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {!loaded ? (
            <View style={styles.centered}><ActivityIndicator /></View>
          ) : (
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                  textContentType="givenName"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                  textContentType="familyName"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>

              <Text style={styles.hint}>
                Phone, password and notification preferences are managed elsewhere.
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.save, (!dirty || submitting) && styles.saveDisabled]}
                disabled={!dirty || submitting}
                onPress={onSave}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save changes</Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#222' },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  hint: { fontSize: 13, color: '#5f6368', marginTop: 4 },
  error: { color: '#b3261e', fontSize: 14 },
  save: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
