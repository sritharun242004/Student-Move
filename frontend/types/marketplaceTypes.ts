// Marketplace Feature Types

export type ListingType = "SINGLE" | "STOCK";

export type ListingStatus = "ACTIVE" | "SOLD" | "REMOVED";

export interface ListingCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export interface ListingPhoto {
  id: string;
  photoUrl: string;
  displayOrder: number;
}

export interface SellerProfile {
  displayName: string;
  profilePhotoUrl: string | null;
}

export interface Listing {
  id: string;
  studentId: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: ListingCategory;
  listingType: ListingType;
  totalStock: number | null;
  soldItems: number;
  contactNumber: string;
  status: ListingStatus;
  photos: ListingPhoto[];
  createdAt: string;
  updatedAt: string;
  sellerProfile: SellerProfile | null;
}

export interface ListingsResponse {
  items: Listing[];
  total: number;
  skip: number;
  take: number;
}

export interface ListingFilters {
  keyword?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  skip?: number;
  take?: number;
}

export interface CreateListingPayload {
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

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  categoryId?: number;
  totalStock?: number;
  contactNumber?: string;
  photoUrls?: string[];
}

export interface UpdateListingStatusPayload {
  status: ListingStatus;
}

export interface UploadedPhoto {
  photoUrl: string;
  fileName: string;
}

export interface Conversation {
  buyerProfile: SellerProfile | null;
  sellerProfile: SellerProfile | null;
  listingFirstPhotoUrl: string | null;
  listingTitle: string;
  id: string;
  listingId: string;
  buyerStudentId: number;
  sellerStudentId: number;
  createdAt: string;
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderStudentId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessagePayload {
  content: string;
}
