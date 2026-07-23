import { useMutation } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { DateField } from '@/components/date-field';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  createApplication,
  type ApplicationDraft,
  type ApplicationStatus,
} from '@/lib/applications-api';

type Step = 0 | 1 | 2 | 3;

const STEP_TITLES = ['About you', 'Contact', 'Tenancy', 'Review'] as const;

function StepDots({ current }: { current: Step }) {
  return (
    <View style={styles.dots}>
      {STEP_TITLES.map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive, i < current && styles.dotDone]}
        />
      ))}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  optional,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  optional?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa0a6"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        multiline={multiline}
      />
    </View>
  );
}

function StatusToggle({
  value,
  onChange,
}: {
  value: ApplicationStatus;
  onChange: (s: ApplicationStatus) => void;
}) {
  return (
    <View style={styles.segmented}>
      {(['Student', 'Employee'] as ApplicationStatus[]).map((s) => (
        <Pressable
          key={s}
          style={[styles.segItem, value === s && styles.segItemActive]}
          onPress={() => onChange(s)}>
          <Text style={[styles.segText, value === s && styles.segTextActive]}>{s}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ApplicationStart() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [step, setStep] = useState<Step>(0);

  // Step 0
  const [status, setStatus] = useState<ApplicationStatus>('Student');
  const [dob, setDob] = useState('');
  const [howHeard, setHowHeard] = useState('');

  // Step 1
  const [homeAddress, setHomeAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [mobile, setMobile] = useState('');
  const [personalEmail, setPersonalEmail] = useState(user?.email ?? '');
  const [workEmail, setWorkEmail] = useState('');

  // Step 2
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amountOfBond, setAmountOfBond] = useState('');
  const [rentPayer, setRentPayer] = useState('Self');

  const canAdvance = useMemo(() => {
    if (step === 0) return !!dob.trim();
    if (step === 1)
      return !!homeAddress.trim() && !!postcode.trim() && /\S+@\S+\.\S+/.test(personalEmail);
    if (step === 2) return !!rentPayer.trim();
    return true;
  }, [step, dob, homeAddress, postcode, personalEmail, rentPayer]);

  const draft: ApplicationDraft = {
    status,
    dob: dob.trim(),
    homeAddress: homeAddress.trim(),
    postcode: postcode.trim(),
    mobile: mobile.trim() || undefined,
    workEmail: workEmail.trim() || undefined,
    personalEmail: personalEmail.trim(),
    rentPayer: rentPayer.trim(),
    howHeard: howHeard.trim() || undefined,
    startDate: startDate.trim() || undefined,
    endDate: endDate.trim() || undefined,
    amountOfBond: Number(amountOfBond) || 0,
  };

  const submit = useMutation({
    mutationFn: () => createApplication(propertyId!, draft),
    onSuccess: () => router.replace(`/application/submitted`),
  });

  const goBack = () => {
    if (step === 0) router.back();
    else setStep((step - 1) as Step);
  };

  const goNext = () => {
    if (step < 3) setStep((step + 1) as Step);
    else submit.mutate();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Apply', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <StepDots current={step} />
          <Text style={styles.stepTitle}>
            Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}
          </Text>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {step === 0 ? (
              <>
                <Text style={styles.label}>I am applying as</Text>
                <StatusToggle value={status} onChange={setStatus} />
                <DateField
                  label="Date of birth"
                  value={dob}
                  onChange={setDob}
                  placeholder="Select date of birth"
                  maximumDate={new Date()}
                />
                <Field
                  label="How did you hear about Student Moves?"
                  value={howHeard}
                  onChangeText={setHowHeard}
                  placeholder="Friend, Instagram, search…"
                  optional
                />
              </>
            ) : step === 1 ? (
              <>
                <Field
                  label="Home address"
                  value={homeAddress}
                  onChangeText={setHomeAddress}
                  placeholder="Street, city"
                  multiline
                />
                <Field
                  label="Postcode"
                  value={postcode}
                  onChangeText={setPostcode}
                  autoCapitalize="words"
                />
                <Field
                  label="Mobile"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  optional
                />
                <Field
                  label="Personal email"
                  value={personalEmail}
                  onChangeText={setPersonalEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {status === 'Employee' ? (
                  <Field
                    label="Work email"
                    value={workEmail}
                    onChangeText={setWorkEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    optional
                  />
                ) : null}
              </>
            ) : step === 2 ? (
              <>
                <DateField
                  label="Move-in date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select move-in date"
                  optional
                />
                <DateField
                  label="Move-out date"
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select move-out date"
                  optional
                  minimumDate={startDate ? new Date(startDate) : undefined}
                />
                <Field
                  label="Deposit amount (£)"
                  value={amountOfBond}
                  onChangeText={setAmountOfBond}
                  placeholder="0"
                  keyboardType="numeric"
                  optional
                />
                <Field label="Who is paying the rent?" value={rentPayer} onChangeText={setRentPayer} />
              </>
            ) : (
              <>
                <Text style={styles.reviewIntro}>Review your details before submitting.</Text>
                <ReviewRow label="Applying as" value={draft.status} />
                <ReviewRow label="DOB" value={draft.dob} />
                <ReviewRow label="Home address" value={draft.homeAddress} />
                <ReviewRow label="Postcode" value={draft.postcode} />
                <ReviewRow label="Personal email" value={draft.personalEmail} />
                {draft.mobile ? <ReviewRow label="Mobile" value={draft.mobile} /> : null}
                {draft.workEmail ? <ReviewRow label="Work email" value={draft.workEmail} /> : null}
                {draft.startDate ? <ReviewRow label="Move-in" value={draft.startDate} /> : null}
                {draft.endDate ? <ReviewRow label="Move-out" value={draft.endDate} /> : null}
                {draft.amountOfBond > 0 ? (
                  <ReviewRow label="Deposit" value={`£${draft.amountOfBond}`} />
                ) : null}
                <ReviewRow label="Rent payer" value={draft.rentPayer} />
                {draft.howHeard ? <ReviewRow label="Heard via" value={draft.howHeard} /> : null}
                <Text style={styles.afterNote}>
                  Next steps after submitting: upload ID document, add guarantor, sign tenancy
                  agreement. You can resume from My Applications.
                </Text>
                {submit.isError ? (
                  <Text style={styles.error}>
                    {submit.error instanceof Error
                      ? submit.error.message
                      : 'Could not submit application'}
                  </Text>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.secondaryBtn} onPress={goBack}>
              <Text style={styles.secondaryText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, (!canAdvance || submit.isPending) && styles.btnDisabled]}
              disabled={!canAdvance || submit.isPending}
              onPress={goNext}>
              {submit.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>{step === 3 ? 'Submit application' : 'Continue'}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingTop: 12, gap: 8 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: '#e8eaed' },
  dotActive: { backgroundColor: '#208AEF' },
  dotDone: { backgroundColor: '#208AEF', opacity: 0.6 },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368',
    textAlign: 'center',
    paddingVertical: 12,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#222' },
  optional: { color: '#9aa0a6', fontWeight: '400' },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#e8eaed',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segItemActive: { backgroundColor: '#fff' },
  segText: { fontSize: 14, color: '#5f6368', fontWeight: '500' },
  segTextActive: { color: '#111', fontWeight: '600' },
  reviewIntro: { fontSize: 14, color: '#5f6368', marginBottom: 6 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  reviewLabel: { fontSize: 14, color: '#5f6368' },
  reviewValue: { fontSize: 14, color: '#111', fontWeight: '500', flex: 1, textAlign: 'right' },
  afterNote: { fontSize: 13, color: '#5f6368', marginTop: 16, lineHeight: 19 },
  error: { color: '#b3261e', fontSize: 14, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  secondaryText: { color: '#3c4043', fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
