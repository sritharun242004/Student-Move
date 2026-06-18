import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { config } from '@/lib/config';
import {
  acknowledge,
  getMyAcknowledgment,
  type Acknowledgment,
} from '@/lib/renters-rights-api';

const KEY_POINTS = [
  'From 1 May 2026, Assured Shorthold Tenancies are abolished and become rolling (periodic) tenancies. Your tenancy will no longer have a fixed end date.',
  'Section 21 "no-fault" evictions can no longer be served. Landlords must use one of the legal grounds for possession under Section 8.',
  'Rent-review clauses in your tenancy agreement stop applying. Rent can only be increased once per year, by Section 13 notice (Form 4A), 2 months in advance, and no higher than the open-market rate.',
  'You have the right to request to keep a pet. Your landlord cannot unreasonably refuse.',
  'If you are a full-time student, your landlord may use possession ground 4A to recover the property at the end of the academic year — but only with prior written notice and at least 4 months\' notice ending between 1 June and 30 September.',
  'You can end your tenancy at any time by giving at least 2 months\' written notice, on a day the rent is due.',
];

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.checkbox, checked && styles.checkboxOn]}>
      {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
    </Pressable>
  );
}

export default function RentersRightsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['renters-rights-ack'],
    queryFn: getMyAcknowledgment,
  });

  const submit = useMutation({
    mutationFn: () =>
      acknowledge({
        pdfVersion: config.rentersRightsPdfVersion,
        deviceInfo: {
          platform: Platform.OS,
          osName: Device.osName,
          osVersion: Device.osVersion,
          modelName: Device.modelName,
          appVersion: Constants.expoConfig?.version,
          runtimeVersion: Constants.expoConfig?.runtimeVersion,
        },
      }),
    onSuccess: (ack) => {
      queryClient.setQueryData(['renters-rights-ack'], { acknowledged: true, acknowledgment: ack });
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Could not save acknowledgment'),
  });

  const openPdf = () => {
    WebBrowser.openBrowserAsync(config.rentersRightsPdfUrl).catch(() => {});
  };

  const existingAck: Acknowledgment | null = data?.acknowledgment ?? null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Renters’ Rights' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.h1}>Renters’ Rights Act 2026</Text>
            <Text style={styles.intro}>
              From 1 May 2026 a new law gives tenants in England additional rights and changes how
              private tenancies work. Before signing a tenancy agreement on Student Moves, you must
              read and acknowledge this information.
            </Text>

            <Text style={styles.h2}>Key points</Text>
            <View style={{ gap: 10 }}>
              {KEY_POINTS.map((pt, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.pdfButton} onPress={openPdf}>
              <Text style={styles.pdfButtonText}>Read the full information sheet (PDF)</Text>
            </Pressable>
            <Text style={styles.pdfNote}>
              Version: {config.rentersRightsPdfVersion}. The document opens in your browser.
            </Text>

            {existingAck ? (
              <View style={styles.ackBox}>
                <Text style={styles.ackTitle}>✓ Acknowledged</Text>
                <Text style={styles.ackBody}>
                  You confirmed this on {new Date(existingAck.acknowledgedAt).toLocaleString()}.
                </Text>
                <Text style={styles.ackBody}>Recorded version: {existingAck.pdfVersion}</Text>
                <Pressable style={[styles.pdfButton, { marginTop: 16 }]} onPress={() => router.back()}>
                  <Text style={styles.pdfButtonText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.confirmBlock}>
                <Pressable style={styles.confirmRow} onPress={() => setChecked((v) => !v)}>
                  <Checkbox checked={checked} onToggle={() => setChecked((v) => !v)} />
                  <Text style={styles.confirmLabel}>
                    I confirm I have received and read the Renters’ Rights Information.
                  </Text>
                </Pressable>

                {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

                <Pressable
                  style={[styles.submit, (!checked || submit.isPending) && styles.submitDisabled]}
                  disabled={!checked || submit.isPending}
                  onPress={() => submit.mutate()}>
                  {submit.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Confirm acknowledgment</Text>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 32, gap: 16 },
  h1: { fontSize: 26, fontWeight: '700', color: '#111' },
  intro: { fontSize: 15, color: '#3c4043', lineHeight: 22 },
  h2: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 8 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 16, color: '#208AEF', lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: '#3c4043', lineHeight: 22 },
  pdfButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  pdfButtonText: { color: '#208AEF', fontSize: 15, fontWeight: '600' },
  pdfNote: { fontSize: 12, color: '#5f6368', textAlign: 'center' },
  confirmBlock: { marginTop: 12, gap: 12 },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  confirmLabel: { flex: 1, fontSize: 14, color: '#111', lineHeight: 20 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#5f6368',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  checkboxTick: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#b3261e', fontSize: 14 },
  submit: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ackBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e6f4ea',
    gap: 4,
  },
  ackTitle: { fontSize: 16, fontWeight: '700', color: '#137333' },
  ackBody: { fontSize: 14, color: '#137333' },
});
