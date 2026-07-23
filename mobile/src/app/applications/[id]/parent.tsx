import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { Field, SubFormShell } from '@/components/sub-form';
import { getParentDetails, saveParentDetails } from '@/lib/applications-api';

export default function ParentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [workName, setWorkName] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [workPostcode, setWorkPostcode] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['parent-details', id],
    queryFn: () => getParentDetails(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setAddress(existing.address);
      setPostcode(existing.postcode);
      setPhone(existing.phone);
      setRelationship(existing.relationship);
      setWorkName(existing.workName);
      setWorkAddress(existing.workAddress);
      setWorkPostcode(existing.workPostcode);
      setWorkPhone(existing.workPhone);
    }
  }, [existing]);

  const canSubmit =
    !!name.trim() &&
    !!address.trim() &&
    !!postcode.trim() &&
    !!phone.trim() &&
    !!relationship.trim();

  const save = useMutation({
    mutationFn: () =>
      saveParentDetails(id!, {
        name: name.trim(),
        address: address.trim(),
        postcode: postcode.trim(),
        phone: phone.trim(),
        workName: workName.trim(),
        workAddress: workAddress.trim(),
        workPostcode: workPostcode.trim(),
        workPhone: workPhone.trim(),
        relationship: relationship.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-details', id] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      router.back();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Next of kin' }} />
      <SubFormShell
        onSubmit={() => {
          setError(null);
          save.mutate();
        }}
        submitting={save.isPending}
        canSubmit={canSubmit}
        submitLabel={existing ? 'Update details' : 'Save details'}
        error={error}>
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="e.g. Mother, Father" />
        <Field label="Home address" value={address} onChangeText={setAddress} multiline />
        <Field label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="words" />
        <Field label="Home phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Employer / Workplace" value={workName} onChangeText={setWorkName} />
        <Field label="Work address" value={workAddress} onChangeText={setWorkAddress} multiline />
        <Field label="Work postcode" value={workPostcode} onChangeText={setWorkPostcode} autoCapitalize="words" />
        <Field label="Work phone" value={workPhone} onChangeText={setWorkPhone} keyboardType="phone-pad" />
      </SubFormShell>
    </>
  );
}
