import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

function formatDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateField({
  label,
  value,
  onChange,
  optional,
  placeholder,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (iso: string) => void;
  optional?: boolean;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const displayValue = value ? formatDisplay(value) : placeholder ?? 'Select date';

  const initial = value ? new Date(value) : new Date();

  const onChangeInternal = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (date) onChange(toIsoDate(date));
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholderText]}>{displayValue}</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={initial}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={onChangeInternal}
              textColor="#111"
            />
          </View>
        </Modal>
      ) : open ? (
        <DateTimePicker
          value={initial}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onChangeInternal}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#222' },
  optional: { color: '#9aa0a6', fontWeight: '400' },
  input: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  value: { fontSize: 16, color: '#111' },
  placeholderText: { color: '#9aa0a6' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
  },
  sheetCancel: { fontSize: 15, color: '#5f6368', fontWeight: '500' },
  sheetDone: { fontSize: 15, color: '#208AEF', fontWeight: '600' },
});
