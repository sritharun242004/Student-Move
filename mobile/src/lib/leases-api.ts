import { mainApi } from './api';

export type Lease = {
  id: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  monthlyRent: string | null;
  installmentType: string;
  property: number;
  tenant: number;
  propertyObj?: {
    id: number;
    name: string | null;
    address: string;
    price: string;
  };
};

export type Utility = {
  id: string;
  amount: string;
  status: string;
  dueDate: string | null;
  description: string | null;
  createdAt: string;
};

type ListResponse<T> = T[] | { results: T[] } | { data: T[]; status: string };

function unwrap<T>(p: ListResponse<T>): T[] {
  if (Array.isArray(p)) return p;
  if ('results' in p && Array.isArray(p.results)) return p.results;
  if ('data' in p && Array.isArray(p.data)) return p.data;
  return [];
}

export async function listMyLeases(): Promise<Lease[]> {
  const { data } = await mainApi.get<ListResponse<Lease>>('/api/tenants/requests/');
  return unwrap(data);
}

export async function listUtilitiesForLease(leaseId: number | string): Promise<Utility[]> {
  const { data } = await mainApi.get<ListResponse<Utility>>(
    `/api/tenants/utilities-list/${leaseId}/`,
  );
  return unwrap(data);
}
