import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/hooks/use-current-user';
import { getAgreement, getTenantSignatures, uploadTenantSignature } from '@/lib/agreement-api';
import { config } from '@/lib/config';
import { getMyAcknowledgment } from '@/lib/renters-rights-api';

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${config.mainServiceBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AgreementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const [error, setError] = useState<string | null>(null);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', id],
    queryFn: () => getAgreement(id!),
    enabled: !!id,
  });
  const { data: signatures } = useQuery({
    queryKey: ['tenant-signatures', id],
    queryFn: () => getTenantSignatures(id!),
    enabled: !!id && !!agreement,
  });
  const { data: rrAck } = useQuery({
    queryKey: ['renters-rights-ack'],
    queryFn: getMyAcknowledgment,
  });

  const mySignature = signatures?.find((s) => s.email === user?.email);
  const hasSigned = !!mySignature;

  const sign = useMutation({
    mutationFn: async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error('Photo library permission is required.');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [3, 1],
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await uploadTenantSignature(
        id!,
        {
          uri: asset.uri,
          name: asset.fileName ?? `signature-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
        {
          tenantName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
          tenantEmail: user?.email,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-signatures', id] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Upload failed'),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Tenancy agreement' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {!agreement ? (
            <View style={styles.waiting}>
              <Text style={styles.waitingTitle}>Waiting for landlord</Text>
              <Text style={styles.waitingBody}>
                Your landlord hasn’t prepared the tenancy agreement yet. You’ll be notified when
                it’s ready to review and sign.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>Agreement summary</Text>
              <View style={styles.card}>
                <Row label="Agent" value={agreement.agent} />
                <Row label="Agent address" value={agreement.agentAddress} />
                <Row label="Move-in" value={agreement.startDate} />
                <Row label="Move-out" value={agreement.endDate} />
                <Row label="Rent" value={agreement.amount ? `£${agreement.amount}` : null} />
                <Row label="Payment terms" value={agreement.paymentDescription} />
              </View>

              <View style={styles.parties}>
                <Text style={styles.sectionHeader}>Parties</Text>
                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Landlord</Text>
                  <Text style={[styles.partyState, agreement.landLordSign && styles.partyStateDone]}>
                    {agreement.landLordSign ? '✓ Signed' : 'Not signed yet'}
                  </Text>
                </View>
                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>Admin</Text>
                  <Text style={[styles.partyState, agreement.adminSign && styles.partyStateDone]}>
                    {agreement.adminSign ? '✓ Signed' : 'Not signed yet'}
                  </Text>
                </View>
                <View style={styles.partyRow}>
                  <Text style={styles.partyLabel}>You</Text>
                  <Text style={[styles.partyState, hasSigned && styles.partyStateDone]}>
                    {hasSigned ? '✓ Signed' : 'Not signed yet'}
                  </Text>
                </View>
              </View>

              {hasSigned ? (
                <View style={styles.signedBox}>
                  <Text style={styles.signedTitle}>Your signature</Text>
                  {mySignature?.sign ? (
                    <Image
                      source={{ uri: resolveMediaUrl(mySignature.sign) ?? '' }}
                      style={styles.sigImage}
                      contentFit="contain"
                    />
                  ) : null}
                </View>
              ) : (
                <View style={styles.signBlock}>
                  {!rrAck?.acknowledged ? (
                    <View style={styles.blockBox}>
                      <Text style={styles.blockText}>
                        You must acknowledge the Renters’ Rights Information before you can sign.
                      </Text>
                      <Pressable
                        style={styles.blockBtn}
                        onPress={() => router.push('/renters-rights')}>
                        <Text style={styles.blockBtnText}>Go to Renters’ Rights</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.signIntro}>
                        Upload a photo of your signature to sign this agreement. Tip: sign on plain
                        paper, then photograph or crop the image.
                      </Text>
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <Pressable
                        style={[styles.primary, sign.isPending && styles.disabled]}
                        disabled={sign.isPending}
                        onPress={() =>
                          Alert.alert(
                            'Sign agreement?',
                            'By uploading your signature you are agreeing to the terms above.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Continue',
                                onPress: () => {
                                  setError(null);
                                  sign.mutate();
                                },
                              },
                            ],
                          )
                        }>
                        {sign.isPending ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryText}>Upload signature</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 16 },
  waiting: {
    backgroundColor: '#fff4e5',
    padding: 20,
    borderRadius: 12,
    gap: 6,
  },
  waitingTitle: { fontSize: 16, fontWeight: '700', color: '#b06000' },
  waitingBody: { fontSize: 14, color: '#b06000', lineHeight: 20 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111' },
  card: {
    backgroundColor: '#f7f8fa',
    padding: 14,
    borderRadius: 12,
  },
  row: { flexDirection: 'row', paddingVertical: 6, justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#5f6368' },
  rowValue: { fontSize: 14, color: '#111', fontWeight: '500', flex: 1, textAlign: 'right' },
  parties: { gap: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f7f8fa',
  },
  partyLabel: { fontSize: 14, color: '#111', fontWeight: '500' },
  partyState: { fontSize: 13, color: '#5f6368' },
  partyStateDone: { color: '#137333', fontWeight: '600' },
  signBlock: { gap: 12 },
  signIntro: { fontSize: 14, color: '#3c4043', lineHeight: 20 },
  primary: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#b3261e', fontSize: 14 },
  signedBox: { backgroundColor: '#e6f4ea', padding: 14, borderRadius: 12, gap: 8 },
  signedTitle: { fontSize: 14, fontWeight: '600', color: '#137333' },
  sigImage: { width: '100%', height: 100, backgroundColor: '#fff', borderRadius: 8 },
  blockBox: {
    backgroundColor: '#fce8e6',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  blockText: { fontSize: 14, color: '#b3261e', lineHeight: 20 },
  blockBtn: { backgroundColor: '#b3261e', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  blockBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
