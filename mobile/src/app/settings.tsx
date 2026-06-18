import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  title,
  subtitle,
  right,
  onPress,
  destructive,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowTitle, destructive && styles.rowDestructive]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const runtimeVersion = String(Constants.expoConfig?.runtimeVersion ?? '');

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Section title="Notifications">
            <Row
              title="Push notifications"
              subtitle="Coming soon — backend support pending"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  disabled
                />
              }
            />
          </Section>

          <Section title="Legal">
            <Row
              title="Privacy policy"
              onPress={() => WebBrowser.openBrowserAsync('https://studentmoves.co.uk/privacy')}
              right={<Text style={styles.chevron}>›</Text>}
            />
            <View style={styles.divider} />
            <Row
              title="Terms of service"
              onPress={() => WebBrowser.openBrowserAsync('https://studentmoves.co.uk/terms')}
              right={<Text style={styles.chevron}>›</Text>}
            />
            <View style={styles.divider} />
            <Row
              title="Renters' Rights Act 2026"
              subtitle="Information sheet"
              onPress={() => WebBrowser.openBrowserAsync('https://cdn.studentmoves.co.uk/public/renters-rights-2026-v1.pdf')}
              right={<Text style={styles.chevron}>›</Text>}
            />
          </Section>

          <Section title="About">
            <Row title="App version" right={<Text style={styles.rowValue}>{appVersion}</Text>} />
            {runtimeVersion ? (
              <>
                <View style={styles.divider} />
                <Row title="Runtime" right={<Text style={styles.rowValue}>{runtimeVersion}</Text>} />
              </>
            ) : null}
            <View style={styles.divider} />
            <Row title="Platform" right={<Text style={styles.rowValue}>{Platform.OS} {Platform.Version}</Text>} />
          </Section>

          <Section title="Account">
            <Row
              title="Sign out"
              onPress={signOut}
              destructive
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa' },
  container: { padding: 16, gap: 16 },
  section: { gap: 6 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  sectionBody: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowTitle: { fontSize: 15, color: '#111' },
  rowDestructive: { color: '#b3261e', fontWeight: '600' },
  rowSubtitle: { fontSize: 12, color: '#5f6368' },
  rowValue: { fontSize: 14, color: '#5f6368' },
  chevron: { fontSize: 22, color: '#9aa0a6' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#dadce0', marginLeft: 14 },
});
