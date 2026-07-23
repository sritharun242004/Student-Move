import { CardField, useConfirmPayment, type CardFieldInput } from '@stripe/stripe-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/hooks/use-current-user';
import { initUtilityPayment } from '@/lib/payments-api';

export default function PayScreen() {
  const { utilityId } = useLocalSearchParams<{ utilityId: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { confirmPayment, loading } = useConfirmPayment();

  const [cardComplete, setCardComplete] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined;

  const onPay = async () => {
    if (!utilityId) return;
    setError(null);
    setStatus('idle');
    try {
      const { clientSecret } = await initUtilityPayment(utilityId);
      const result = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: fullName,
            email: user?.email,
          },
        },
      });
      if (result.error) {
        setError(result.error.message);
        setStatus('error');
      } else if (result.paymentIntent) {
        setStatus('success');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setStatus('error');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Pay bill' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            {status === 'success' ? (
              <View style={styles.successBox}>
                <View style={styles.checkBubble}><Text style={styles.check}>✓</Text></View>
                <Text style={styles.successTitle}>Payment successful</Text>
                <Text style={styles.successBody}>
                  Your payment has been received. It may take a few minutes to reflect in your
                  tenancy overview.
                </Text>
                <Pressable
                  style={styles.primary}
                  onPress={() => router.replace('/tenancy')}>
                  <Text style={styles.primaryText}>Back to tenancy</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.heading}>Card details</Text>
                <Text style={styles.body}>
                  Enter your card details below. We use Stripe to process payments securely — Student
                  Moves never sees your card number.
                </Text>

                <CardField
                  postalCodeEnabled
                  placeholders={{ number: '4242 4242 4242 4242' }}
                  cardStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#dadce0',
                    borderWidth: 1,
                    borderRadius: 10,
                    textColor: '#111',
                    placeholderColor: '#9aa0a6',
                    fontSize: 16,
                  }}
                  style={styles.cardField}
                  onCardChange={(details: CardFieldInput.Details) =>
                    setCardComplete(details.complete)
                  }
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={[styles.primary, (!cardComplete || loading) && styles.disabled]}
                  disabled={!cardComplete || loading}
                  onPress={onPay}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Pay now</Text>
                  )}
                </Pressable>

                <Text style={styles.footer}>
                  Test card: 4242 4242 4242 4242 · any future date · any CVC · any postcode.
                </Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  container: { flex: 1, padding: 20, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  body: { fontSize: 14, color: '#5f6368', lineHeight: 20 },
  cardField: { width: '100%', height: 50, marginTop: 8 },
  error: { color: '#b3261e', fontSize: 14 },
  primary: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  footer: { fontSize: 12, color: '#9aa0a6', textAlign: 'center', marginTop: 'auto' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  checkBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { fontSize: 36, color: '#137333', fontWeight: '700' },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  successBody: { fontSize: 14, color: '#5f6368', textAlign: 'center' },
});
