import { mainApi } from './api';

export type Acknowledgment = {
  id: number;
  pdfVersion: string;
  acknowledgedAt: string;
  ipAddress: string | null;
  userAgent: string;
  deviceInfo: Record<string, unknown> | null;
};

type GetMyResponse = {
  acknowledged: boolean;
  acknowledgment: Acknowledgment | null;
};

type CreateResponse = {
  status: 'success';
  message: string;
  data: Acknowledgment;
};

export async function getMyAcknowledgment(): Promise<GetMyResponse> {
  const { data } = await mainApi.get<GetMyResponse>('/api/tenants/renters-rights-ack/');
  return data;
}

export async function acknowledge(input: {
  pdfVersion: string;
  deviceInfo: Record<string, unknown>;
}): Promise<Acknowledgment> {
  const { data } = await mainApi.post<CreateResponse>('/api/tenants/renters-rights-ack/', {
    pdf_version: input.pdfVersion,
    device_info: input.deviceInfo,
  });
  return data.data;
}
