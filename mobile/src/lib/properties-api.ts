import { mainApi } from './api';
import { config } from './config';

export type PropertyImage = {
  id: number;
  image: string;
};

export type Property = {
  id: number;
  name: string | null;
  address: string;
  description: string;
  price: string;
  rooms: number;
  bathrooms: number;
  zipCode: string | null;
  epcRating: string;
  availableAfter: string | null;
  availableTo: string | null;
  status: string;
  images: PropertyImage[];
  isFeatured: boolean;
};

type ListResponse = {
  status: string;
  message: string;
  data: Property[] | { results: Property[] };
};

export function resolveImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${config.mainServiceBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function listProperties(): Promise<Property[]> {
  const { data } = await mainApi.get<ListResponse>('/api/properties/all/');
  const payload = data.data;
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
}

export async function getProperty(id: number | string): Promise<Property> {
  const { data } = await mainApi.get<Property>(`/api/properties/${id}/`);
  return data;
}
