import { mainApi } from './api';

export type InitPaymentResponse = {
  clientSecret: string;
  payment_id: string;
};

export async function initUtilityPayment(utilityId: string): Promise<InitPaymentResponse> {
  const { data } = await mainApi.post<InitPaymentResponse>(
    '/api/tenants/payments/init/',
    { utilityId },
  );
  return data;
}

export async function verifyPayment(paymentId: string): Promise<{ status: string }> {
  const { data } = await mainApi.get<{ status: string }>(
    `/api/tenants/payments/${paymentId}/verify/`,
  );
  return data;
}
