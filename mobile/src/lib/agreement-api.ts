import { mainApi } from './api';

export type Agreement = {
  id: number;
  application: number;
  date: string | null;
  agent: string | null;
  agentAddress: string | null;
  startDate: string | null;
  endDate: string | null;
  amount: string | null;
  paymentDescription: string | null;
  landLordSign: string | null;
  landLordSign1: string | null;
  adminSign: string | null;
  adminSign1: string | null;
  adminName: string | null;
  adminName1: string | null;
};

export type TenantSignature = {
  id: number;
  fullName: string;
  email: string;
  sign: string;
  createdAt?: string;
};

export async function getAgreement(formId: number | string): Promise<Agreement | null> {
  try {
    const { data } = await mainApi.get<Agreement>(`/api/forms/${formId}/agreement/`);
    return data;
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'response' in e &&
      (e as { response: { status: number } }).response?.status === 404
    ) {
      return null;
    }
    throw e;
  }
}

export async function getTenantSignatures(formId: number | string): Promise<TenantSignature[]> {
  try {
    const { data } = await mainApi.get<TenantSignature[] | { results: TenantSignature[] }>(
      `/api/forms/${formId}/agreement/tenant-signatures/`,
    );
    if (Array.isArray(data)) return data;
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function uploadTenantSignature(
  formId: number | string,
  file: { uri: string; name: string; type: string },
  extras?: { tenantName?: string; tenantEmail?: string; tenantPhone?: string },
): Promise<void> {
  const form = new FormData();
  form.append('signature', file as unknown as Blob);
  if (extras?.tenantName) form.append('tenant_name', extras.tenantName);
  if (extras?.tenantEmail) form.append('tenant_email', extras.tenantEmail);
  if (extras?.tenantPhone) form.append('tenant_phone', extras.tenantPhone);
  await mainApi.post(`/api/forms/${formId}/agreement/tenant-signature/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
