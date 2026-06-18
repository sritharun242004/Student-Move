import { ListingStatus, ListingType } from '../domain/entities/listing.entity';

// ---- Input DTOs ----

export interface CreateListingDto {
  title: string;
  description: string;
  price: number;
  location: string;
  categoryId: number;
  listingType: ListingType;
  totalStock?: number;
  contactNumber: string;
  photoUrls?: string[];
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  categoryId?: number;
  totalStock?: number;
  contactNumber?: string;
  photoUrls?: string[];
}

export interface UpdateListingStatusDto {
  status: ListingStatus;
}

export interface BrowseListingsDto {
  keyword?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  skip?: number;
  take?: number;
}

// ---- View types ----

export interface ListingPhotoView {
  id: string;
  photoUrl: string;
  displayOrder: number;
}

export interface CategoryView {
  id: number;
  name: string;
  parentId?: number;
}

export interface ListingView {
  id: string;
  studentId: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: CategoryView;
  listingType: ListingType;
  totalStock?: number;
  soldItems: number;
  contactNumber: string;
  status: ListingStatus;
  photos: ListingPhotoView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedListingView {
  items: ListingView[];
  total: number;
  skip: number;
  take: number;
}
