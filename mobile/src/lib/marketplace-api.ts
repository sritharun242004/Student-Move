import { gatewayApi } from './api';

export type MarketplacePhoto = {
  id: string;
  photoUrl: string;
  displayOrder: number;
};

export type MarketplaceSeller = {
  displayName: string;
  profilePhotoUrl: string | null;
};

export type MarketplaceCategory = {
  id: number;
  name: string;
  parentId: number | null;
};

export type MarketplaceListing = {
  id: string;
  studentId: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: MarketplaceCategory | null;
  listingType: 'SINGLE' | 'MULTI' | string;
  totalStock: number | null;
  soldItems: number;
  contactNumber: string | null;
  status: string;
  photos: MarketplacePhoto[];
  createdAt: string;
  updatedAt: string;
  sellerProfile: MarketplaceSeller | null;
};

type ListResponse = {
  items: MarketplaceListing[];
  total?: number;
};

export async function listMarketplaceListings(): Promise<MarketplaceListing[]> {
  const { data } = await gatewayApi.get<ListResponse>('/marketplace/listings');
  return data.items ?? [];
}

export async function getMarketplaceListing(id: string): Promise<MarketplaceListing> {
  const { data } = await gatewayApi.get<MarketplaceListing>(`/marketplace/listings/${id}`);
  return data;
}
