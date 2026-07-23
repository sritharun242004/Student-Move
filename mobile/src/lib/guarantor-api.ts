import { mainApi } from './api';
import { config } from './config';

export type GuarantorShareToken = {
  id: number;
  token: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  accessedAt: string | null;
  shareUrl: string;
};

type TokenResponse = {
  status: 'success';
  message: string;
  data: GuarantorShareToken;
};

export type GuarantorForm = {
  id: number;
  guarantorName: string;
  occupation: string;
  personalEmail: string | null;
  mobile: string;
  creditCheck: string;
};

export async function createOrGetShareToken(applicationId: number | string): Promise<GuarantorShareToken> {
  const { data } = await mainApi.post<TokenResponse>(
    `/api/forms/application/${applicationId}/share-token/`,
    {},
  );
  return data.data;
}

export function buildGuarantorShareLink(token: string): string {
  return `${config.webBaseUrl}/guarantor/shared/${token}`;
}

export async function getGuarantorForm(formId: number | string): Promise<GuarantorForm | null> {
  try {
    const { data } = await mainApi.get<GuarantorForm>(`/api/forms/${formId}/guarantor/`);
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
