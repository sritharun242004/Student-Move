import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { Field, SubFormShell } from '@/components/sub-form';
import { getStudentDetails, saveStudentDetails } from '@/lib/applications-api';

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [university, setUniversity] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [length, setLength] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [nin, setNin] = useState('');
  const [loan, setLoan] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['student-details', id],
    queryFn: () => getStudentDetails(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setUniversity(existing.university);
      setStudentId(existing.studentId);
      setCourseName(existing.courseName);
      setLength(existing.length);
      setCurrentYear(String(existing.currentYear));
      setNin(existing.nin);
      setLoan(String(existing.loanRecieved));
    }
  }, [existing]);

  const canSubmit =
    !!university && !!studentId && !!courseName && !!length && !!currentYear && !!nin;

  const save = useMutation({
    mutationFn: () =>
      saveStudentDetails(id!, {
        university: university.trim(),
        studentId: studentId.trim(),
        courseName: courseName.trim(),
        length: length.trim(),
        currentYear: Number(currentYear) || 0,
        nin: nin.trim(),
        loanRecieved: Number(loan) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-details', id] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      router.back();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Student details' }} />
      <SubFormShell
        onSubmit={() => {
          setError(null);
          save.mutate();
        }}
        submitting={save.isPending}
        canSubmit={canSubmit}
        submitLabel={existing ? 'Update details' : 'Save details'}
        error={error}>
        <Field label="University" value={university} onChangeText={setUniversity} />
        <Field label="Student ID" value={studentId} onChangeText={setStudentId} />
        <Field label="Course name" value={courseName} onChangeText={setCourseName} />
        <Field label="Course length" value={length} onChangeText={setLength} placeholder="e.g. 3 years" />
        <Field
          label="Current year"
          value={currentYear}
          onChangeText={setCurrentYear}
          keyboardType="numeric"
          placeholder="1"
        />
        <Field
          label="National Insurance Number"
          value={nin}
          onChangeText={setNin}
          autoCapitalize="words"
        />
        <Field
          label="Student loan received (£)"
          value={loan}
          onChangeText={setLoan}
          keyboardType="numeric"
          placeholder="0"
        />
      </SubFormShell>
    </>
  );
}
