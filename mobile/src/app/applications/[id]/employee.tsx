import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { Field, SubFormShell } from '@/components/sub-form';
import { getEmployeeDetails, saveEmployeeDetails } from '@/lib/applications-api';

export default function EmployeeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [employer, setEmployer] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['employee-details', id],
    queryFn: () => getEmployeeDetails(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setEmployer(existing.employer);
      setAddress(existing.address);
      setPostcode(existing.postcode);
      setPhone(existing.phone);
      setYears(String(existing.years));
      setMonths(String(existing.months));
      setJobTitle(existing.jobTitle);
    }
  }, [existing]);

  const canSubmit =
    !!employer.trim() && !!address.trim() && !!postcode.trim() && !!phone.trim() && !!jobTitle.trim();

  const save = useMutation({
    mutationFn: () =>
      saveEmployeeDetails(id!, {
        employer: employer.trim(),
        address: address.trim(),
        postcode: postcode.trim(),
        phone: phone.trim(),
        years: Number(years) || 0,
        months: Number(months) || 0,
        jobTitle: jobTitle.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-details', id] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      router.back();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Employer details' }} />
      <SubFormShell
        onSubmit={() => {
          setError(null);
          save.mutate();
        }}
        submitting={save.isPending}
        canSubmit={canSubmit}
        submitLabel={existing ? 'Update details' : 'Save details'}
        error={error}>
        <Field label="Employer" value={employer} onChangeText={setEmployer} multiline />
        <Field label="Job title" value={jobTitle} onChangeText={setJobTitle} />
        <Field label="Employer address" value={address} onChangeText={setAddress} multiline />
        <Field label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="words" />
        <Field label="Employer phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field
          label="Years at this employer"
          value={years}
          onChangeText={setYears}
          keyboardType="numeric"
          placeholder="0"
        />
        <Field
          label="Additional months"
          value={months}
          onChangeText={setMonths}
          keyboardType="numeric"
          placeholder="0"
        />
      </SubFormShell>
    </>
  );
}
