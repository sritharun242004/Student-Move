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

// ---------- Sub-forms ----------

export type StudentDetails = {
  university: string;
  studentId: string;
  courseName: string;
  length: string;
  currentYear: number;
  nin: string;
  loanRecieved: number;
};

export type EmployeeDetails = {
  employer: string;
  address: string;
  postcode: string;
  phone: string;
  years: number;
  months: number;
  jobTitle: string;
};

export type ParentDetails = {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  workName: string;
  workAddress: string;
  workPostcode: string;
  workPhone: string;
  relationship: string;
};

export type PreviousLandlordDetails = {
  name?: string;
  address?: string;
  postcode?: string;
  numberOfBeds?: number;
  currentRent?: number;
  perWeek?: number;
  bond?: number;
};

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const { data } = await mainApi.get<T>(url);
    return data;
  } catch (e) {
    // 404 = not filled in yet; treat as null. Re-throw other errors.
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

export const getStudentDetails = (formId: number | string) =>
  safeGet<StudentDetails>(`/api/forms/${formId}/student/`);
export const getEmployeeDetails = (formId: number | string) =>
  safeGet<EmployeeDetails>(`/api/forms/${formId}/employee/`);
export const getParentDetails = (formId: number | string) =>
  safeGet<ParentDetails>(`/api/forms/${formId}/parent/`);
export const getPreviousLandlord = (formId: number | string) =>
  safeGet<PreviousLandlordDetails>(`/api/forms/${formId}/landlord/`);

export async function saveStudentDetails(formId: number | string, d: StudentDetails) {
  await mainApi.post(`/api/forms/${formId}/student/`, {
    university: d.university,
    student_id: d.studentId,
    course_name: d.courseName,
    length: d.length,
    current_year: d.currentYear,
    nin: d.nin,
    loan_recieved: d.loanRecieved,
  });
}

export async function saveEmployeeDetails(formId: number | string, d: EmployeeDetails) {
  await mainApi.post(`/api/forms/${formId}/employee/`, {
    employer: d.employer,
    address: d.address,
    postcode: d.postcode,
    phone: d.phone,
    years: d.years,
    months: d.months,
    job_title: d.jobTitle,
  });
}

export async function saveParentDetails(formId: number | string, d: ParentDetails) {
  await mainApi.post(`/api/forms/${formId}/parent/`, {
    name: d.name,
    address: d.address,
    postcode: d.postcode,
    phone: d.phone,
    work_name: d.workName,
    work_address: d.workAddress,
    work_postcode: d.workPostcode,
    work_phone: d.workPhone,
    relationship: d.relationship,
  });
}

export async function savePreviousLandlord(formId: number | string, d: PreviousLandlordDetails) {
  await mainApi.post(`/api/forms/${formId}/landlord/`, {
    name: d.name || null,
    address: d.address || null,
    postcode: d.postcode || null,
    number_of_beds: d.numberOfBeds ?? null,
    current_rent: d.currentRent ?? null,
    per_week: d.perWeek ?? null,
    bond: d.bond ?? null,
  });
}
