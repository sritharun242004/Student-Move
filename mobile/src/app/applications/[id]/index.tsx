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

import {
  getApplication,
  getEmployeeDetails,
  getParentDetails,
  getStudentDetails,
  markApplicationCompleted,
  uploadNic,
  type ApplicationDetail,
} from '@/lib/applications-api';
import { config } from '@/lib/config';
import { getMyAcknowledgment } from '@/lib/renters-rights-api';

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${config.mainServiceBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function ChecklistRow({
  title,
  subtitle,
  status,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  status: 'done' | 'pending' | 'locked';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const icon = status === 'done' ? '✓' : status === 'locked' ? '·' : '→';
  return (
    <Pressable style={[styles.row, disabled && styles.rowDisabled]} onPress={onPress} disabled={disabled}>
      <View
        style={[
          styles.iconBubble,
          status === 'done' && styles.iconBubbleDone,
          status === 'locked' && styles.iconBubbleLocked,
        ]}>
        <Text style={[styles.iconText, status === 'done' && styles.iconTextDone]}>{icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

async function pickAndUploadNic(
  id: number,
  setError: (msg: string | null) => void,
  onSuccess: () => void,
) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    setError('Photo library permission is required.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || !result.assets[0]) return;
  const asset = result.assets[0];
  const name = asset.fileName ?? `nic-${Date.now()}.jpg`;
  const type = asset.mimeType ?? 'image/jpeg';
  try {
    await uploadNic(id, { uri: asset.uri, name, type });
    onSuccess();
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Upload failed');
  }
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    data: app,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['application', id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });

  const { data: rrAck } = useQuery({
    queryKey: ['renters-rights-ack'],
    queryFn: getMyAcknowledgment,
  });

  const { data: student } = useQuery({
    queryKey: ['student-details', id],
    queryFn: () => getStudentDetails(id!),
    enabled: !!id && app?.status === 'Student',
  });
  const { data: employee } = useQuery({
    queryKey: ['employee-details', id],
    queryFn: () => getEmployeeDetails(id!),
    enabled: !!id && app?.status === 'Employee',
  });
  const { data: parent } = useQuery({
    queryKey: ['parent-details', id],
    queryFn: () => getParentDetails(id!),
    enabled: !!id,
  });

  const complete = useMutation({
    mutationFn: () => markApplicationCompleted(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['application', id] }),
    onError: (e) =>
      Alert.alert(
        'Could not complete',
        e instanceof Error ? e.message : 'Unknown error',
      ),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  if (isError || !app) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn’t load application</Text>
        <Text style={styles.errorMsg}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
        <Pressable style={styles.retry} onPress={() => router.back()}>
          <Text style={styles.retryText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const nicUrl = resolveMediaUrl(app.nic);
  const hasNic = !!app.nic;
  const hasSignature = !!app.signature;
  const rrDone = !!rrAck?.acknowledged;
  const hasStudent = !!student;
  const hasEmployee = !!employee;
  const hasParent = !!parent;
  const statusFormDone = app.status === 'Student' ? hasStudent : hasEmployee;
  const canComplete = hasNic && rrDone && statusFormDone && hasParent;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: `Application #${app.id}` }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Property #{app.property}</Text>
            <View style={styles.pills}>
              <View style={[styles.pill, styles.pillNeutral]}>
                <Text style={styles.pillText}>{app.status}</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  app.isCompleted ? styles.pillDone : styles.pillPending,
                ]}>
                <Text
                  style={[
                    styles.pillText,
                    app.isCompleted ? styles.pillDoneText : styles.pillPendingText,
                  ]}>
                  {app.isCompleted ? 'Submitted' : 'In progress'}
                </Text>
              </View>
              {app.creditCheck !== 'Default' ? (
                <View style={[styles.pill, styles.pillNeutral]}>
                  <Text style={styles.pillText}>Credit: {app.creditCheck}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text style={styles.sectionHeader}>Next steps</Text>

          <ChecklistRow
            title="Personal details"
            subtitle="Submitted with your application"
            status="done"
          />

          <ChecklistRow
            title="Upload ID document"
            subtitle={
              hasNic ? 'Uploaded' : 'Right-to-Rent verification — passport, driving licence or ID card'
            }
            status={hasNic ? 'done' : 'pending'}
            onPress={() =>
              pickAndUploadNic(app.id, setUploadError, () =>
                queryClient.invalidateQueries({ queryKey: ['application', id] }),
              )
            }
          />

          {nicUrl ? (
            <Image source={{ uri: nicUrl }} style={styles.nicPreview} contentFit="cover" />
          ) : null}
          {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}

          <ChecklistRow
            title="Renters’ Rights Act 2026"
            subtitle={rrDone ? 'Acknowledged' : 'Read the info sheet and confirm before signing'}
            status={rrDone ? 'done' : 'pending'}
            onPress={() => router.push('/renters-rights')}
          />

          {app.status === 'Student' ? (
            <ChecklistRow
              title="Student details"
              subtitle={hasStudent ? 'Provided' : 'University, course, student ID, loan'}
              status={hasStudent ? 'done' : 'pending'}
              onPress={() => router.push(`/applications/${app.id}/student`)}
            />
          ) : (
            <ChecklistRow
              title="Employer details"
              subtitle={hasEmployee ? 'Provided' : 'Employer, job title, tenure'}
              status={hasEmployee ? 'done' : 'pending'}
              onPress={() => router.push(`/applications/${app.id}/employee`)}
            />
          )}

          <ChecklistRow
            title="Next of kin"
            subtitle={hasParent ? 'Provided' : 'Parent or guardian contact'}
            status={hasParent ? 'done' : 'pending'}
            onPress={() => router.push(`/applications/${app.id}/parent`)}
          />

          <ChecklistRow
            title="Previous landlord (optional)"
            subtitle="Rental history — helps with your credit check"
            status="pending"
            onPress={() => router.push(`/applications/${app.id}/landlord`)}
          />

          <ChecklistRow
            title="Guarantor details"
            subtitle="Add a guarantor — coming soon"
            status="locked"
            disabled
          />

          <ChecklistRow
            title="Sign tenancy agreement"
            subtitle={hasSignature ? 'Signed' : 'After steps above — coming soon'}
            status={hasSignature ? 'done' : 'locked'}
            disabled
          />

          {!app.isCompleted ? (
            <Pressable
              style={[styles.completeBtn, (!canComplete || complete.isPending) && styles.btnDisabled]}
              disabled={!canComplete || complete.isPending}
              onPress={() =>
                Alert.alert(
                  'Submit final application?',
                  'This marks your application as complete and notifies the landlord’s admin team.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Submit', onPress: () => complete.mutate() },
                  ],
                )
              }>
              {complete.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.completeBtnText}>
                  {canComplete ? 'Submit final application' : 'Complete steps above first'}
                </Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.completedNotice}>
              <Text style={styles.completedText}>Application submitted and awaiting review.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  scroll: { padding: 20, gap: 14 },
  hero: { gap: 8, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  pills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillNeutral: { backgroundColor: '#e8eaed' },
  pillDone: { backgroundColor: '#e6f4ea' },
  pillPending: { backgroundColor: '#fff4e5' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#3c4043' },
  pillDoneText: { color: '#137333' },
  pillPendingText: { color: '#b06000' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
    gap: 12,
  },
  rowDisabled: { opacity: 0.55 },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8eaed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleDone: { backgroundColor: '#e6f4ea' },
  iconBubbleLocked: { backgroundColor: '#f1f3f4' },
  iconText: { fontSize: 15, color: '#5f6368', fontWeight: '600' },
  iconTextDone: { color: '#137333' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  rowSubtitle: { fontSize: 13, color: '#5f6368' },
  nicPreview: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#e8eaed' },
  error: { color: '#b3261e', fontSize: 14 },
  completeBtn: {
    marginTop: 12,
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  completedNotice: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#e6f4ea',
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: { color: '#137333', fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#b3261e' },
  errorMsg: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
  retry: { backgroundColor: '#208AEF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
