import { mainApi } from './api';

export type ApplicationStatus = 'Student' | 'Employee';

export type ApplicationDraft = {
  status: ApplicationStatus;
  dob: string;
  homeAddress: string;
  postcode: string;
  currentPhone?: string;
  mobile?: string;
  workEmail?: string;
  personalEmail: string;
  rentPayer: string;
  howHeard?: string;
  startDate?: string;
  endDate?: string;
  amountOfBond: number;
};

export type Application = {
  id: number;
  user: number;
  property: number;
  status: ApplicationStatus;
  isCompleted: boolean;
  creditCheck: string;
  dob: string;
  homeAddress: string;
  postcode: string;
  personalEmail: string;
  mobile: string | null;
  startDate: string | null;
  endDate: string | null;
  amountOfBond: string;
  date: string | null;
};

type ListResponse =
  | Application[]
  | { results: Application[] }
  | { status: string; data: Application[] };

function unwrapList(payload: ListResponse): Application[] {
  if (Array.isArray(payload)) return payload;
  if ('results' in payload && Array.isArray(payload.results)) return payload.results;
  if ('data' in payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function listMyApplications(): Promise<Application[]> {
  const { data } = await mainApi.get<ListResponse>('/api/forms/applications/');
  return unwrapList(data);
}

export async function createApplication(
  propertyId: number | string,
  draft: ApplicationDraft,
): Promise<Application> {
  const payload = {
    status: draft.status,
    dob: draft.dob,
    home_address: draft.homeAddress,
    postcode: draft.postcode,
    current_phone: draft.currentPhone || null,
    mobile: draft.mobile || null,
    work_email: draft.workEmail || null,
    personal_email: draft.personalEmail,
    rent_payer: draft.rentPayer,
    how_heard: draft.howHeard || null,
    start_date: draft.startDate || null,
    end_date: draft.endDate || null,
    amount_of_bond: draft.amountOfBond,
  };
  const { data } = await mainApi.post<Application>(`/api/forms/apply/${propertyId}/`, payload);
  return data;
}

export type ApplicationDetail = Application & {
  nic?: string | null;
  signature?: string | null;
};

export async function getApplication(id: number | string): Promise<ApplicationDetail> {
  const { data } = await mainApi.get<ApplicationDetail>(`/api/forms/application/${id}/`);
  return data;
}

export async function uploadNic(
  id: number | string,
  file: { uri: string; name: string; type: string },
): Promise<void> {
  const form = new FormData();
  form.append('nic', file as unknown as Blob);
  await mainApi.put(`/api/forms/application/${id}/add-nic/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function markApplicationCompleted(id: number | string): Promise<void> {
  await mainApi.patch(`/api/forms/application/${id}/completed/`, {});
}
