import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Field, SubFormShell } from '@/components/sub-form';
import { getPreviousLandlord, savePreviousLandlord } from '@/lib/applications-api';

export default function PreviousLandlordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [beds, setBeds] = useState('');
  const [rent, setRent] = useState('');
  const [perWeek, setPerWeek] = useState('');
  const [bond, setBond] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['previous-landlord', id],
    queryFn: () => getPreviousLandlord(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setAddress(existing.address ?? '');
      setPostcode(existing.postcode ?? '');
      setBeds(existing.numberOfBeds != null ? String(existing.numberOfBeds) : '');
      setRent(existing.currentRent != null ? String(existing.currentRent) : '');
      setPerWeek(existing.perWeek != null ? String(existing.perWeek) : '');
      setBond(existing.bond != null ? String(existing.bond) : '');
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () =>
      savePreviousLandlord(id!, {
        name: name.trim() || undefined,
        address: address.trim() || undefined,
        postcode: postcode.trim() || undefined,
        numberOfBeds: beds ? Number(beds) : undefined,
        currentRent: rent ? Number(rent) : undefined,
        perWeek: perWeek ? Number(perWeek) : undefined,
        bond: bond ? Number(bond) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['previous-landlord', id] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      router.back();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Previous landlord' }} />
      <SubFormShell
        onSubmit={() => {
          setError(null);
          save.mutate();
        }}
        submitting={save.isPending}
        submitLabel={existing ? 'Update details' : 'Save details'}
        error={error}
        header={
          <Text style={styles.intro}>
            Only fill this in if you’ve rented before. All fields are optional.
          </Text>
        }>
        <Field label="Previous landlord name" value={name} onChangeText={setName} optional />
        <Field label="Property address" value={address} onChangeText={setAddress} multiline optional />
        <Field label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="words" optional />
        <Field label="Number of bedrooms" value={beds} onChangeText={setBeds} keyboardType="numeric" optional />
        <Field label="Rent per month (£)" value={rent} onChangeText={setRent} keyboardType="numeric" optional />
        <Field label="Rent per week (£)" value={perWeek} onChangeText={setPerWeek} keyboardType="numeric" optional />
        <Field label="Deposit / bond paid (£)" value={bond} onChangeText={setBond} keyboardType="numeric" optional />
      </SubFormShell>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: '#5f6368', lineHeight: 19 },
});
