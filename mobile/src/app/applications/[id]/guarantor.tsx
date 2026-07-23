import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  buildGuarantorShareLink,
  createOrGetShareToken,
  getGuarantorForm,
} from '@/lib/guarantor-api';

export default function GuarantorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const token = useMutation({
    mutationFn: () => createOrGetShareToken(id!),
  });

  const { data: guarantorForm, refetch } = useQuery({
    queryKey: ['guarantor-form', id],
    queryFn: () => getGuarantorForm(id!),
    enabled: !!id,
  });

  const shareUrl = token.data ? buildGuarantorShareLink(token.data.token) : null;

  const onShare = async () => {
    if (!shareUrl) return;
    try {
      await Share.share({
        message: `Hi — I'm applying for a property on Student Moves and I need you as my guarantor. Please fill out the guarantor form here: ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // user cancelled or share failed silently
    }
  };

  const onCopy = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Guarantor' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>
          <Text style={styles.heading}>Invite your guarantor</Text>
          <Text style={styles.body}>
            Your guarantor completes their part on the web. Generate a secure link, then send it via
            WhatsApp, email or text.
          </Text>

          {guarantorForm ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneTitle}>✓ Guarantor completed</Text>
              <Text style={styles.doneName}>{guarantorForm.guarantorName}</Text>
              {guarantorForm.personalEmail ? (
                <Text style={styles.doneMeta}>{guarantorForm.personalEmail}</Text>
              ) : null}
              <Text style={styles.doneMeta}>Credit check: {guarantorForm.creditCheck}</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {!token.data ? (
                <Pressable
                  style={[styles.primary, token.isPending && styles.disabled]}
                  disabled={token.isPending}
                  onPress={() => token.mutate()}>
                  {token.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Generate share link</Text>
                  )}
                </Pressable>
              ) : (
                <>
                  <View style={styles.linkBox}>
                    <Text style={styles.linkLabel}>Share link</Text>
                    <Text style={styles.linkValue} numberOfLines={2}>
                      {shareUrl}
                    </Text>
                    <Text style={styles.linkMeta}>
                      Expires {new Date(token.data.expiresAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable style={styles.primary} onPress={onShare}>
                    <Text style={styles.primaryText}>Share with guarantor</Text>
                  </Pressable>
                  <Pressable style={styles.secondary} onPress={onCopy}>
                    <Text style={styles.secondaryText}>{copied ? 'Copied!' : 'Copy link'}</Text>
                  </Pressable>
                  <Text style={styles.status}>
                    {token.data.accessedAt
                      ? `Opened by guarantor on ${new Date(token.data.accessedAt).toLocaleString()}`
                      : 'Not opened yet'}
                  </Text>
                  <Pressable style={styles.refreshBtn} onPress={() => refetch()}>
                    <Text style={styles.refreshText}>Check for updates</Text>
                  </Pressable>
                </>
              )}
              {token.isError ? (
                <Text style={styles.error}>
                  {token.error instanceof Error
                    ? token.error.message
                    : 'Could not create share link'}
                </Text>
              ) : null}
            </View>
          )}

          <Text style={styles.footer}>
            The link is unique to your application and will expire. Anyone with the link can submit
            guarantor details, so only share it with the person you want.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  body: { fontSize: 14, color: '#5f6368', lineHeight: 20 },
  primary: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: {
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#3c4043', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  linkBox: {
    backgroundColor: '#f7f8fa',
    padding: 14,
    borderRadius: 10,
    gap: 4,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkValue: { fontSize: 13, color: '#111', fontFamily: 'Menlo' },
  linkMeta: { fontSize: 12, color: '#5f6368', marginTop: 2 },
  status: { fontSize: 13, color: '#5f6368', textAlign: 'center', marginTop: 4 },
  refreshBtn: { alignItems: 'center', paddingVertical: 8 },
  refreshText: { color: '#208AEF', fontSize: 14, fontWeight: '600' },
  doneBox: {
    backgroundColor: '#e6f4ea',
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  doneTitle: { fontSize: 16, fontWeight: '700', color: '#137333' },
  doneName: { fontSize: 15, color: '#137333' },
  doneMeta: { fontSize: 13, color: '#137333' },
  error: { color: '#b3261e', fontSize: 14 },
  footer: {
    fontSize: 12,
    color: '#9aa0a6',
    marginTop: 'auto',
    lineHeight: 17,
  },
});
