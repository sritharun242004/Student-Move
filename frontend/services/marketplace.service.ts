import axios from "axios";
import type {
  ListingCategory,
  Listing,
  ListingsResponse,
  ListingFilters,
  CreateListingPayload,
  UpdateListingPayload,
  UpdateListingStatusPayload,
  UploadedPhoto,
  Conversation,
  Message,
  SendMessagePayload,
} from "@/types/marketplaceTypes";

const marketplaceAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  timeout: 25000,
});

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const MarketplaceService = {
  // ─── Categories ───────────────────────────────────────────────────

  async getCategories(token: string): Promise<ListingCategory[]> {
    const response = await marketplaceAxios.get<ListingCategory[]>(
      "/marketplace/categories",
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ─── Listings (shared/authenticated) ──────────────────────────────

  async getListings(filters: ListingFilters, token: string): Promise<ListingsResponse> {
    const params: Record<string, string | number> = {};
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.categoryId !== undefined) params.categoryId = filters.categoryId;
    if (filters.priceMin !== undefined) params.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) params.priceMax = filters.priceMax;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.take !== undefined) params.take = filters.take;

    const response = await marketplaceAxios.get<ListingsResponse>(
      "/marketplace/listings",
      { headers: authHeaders(token), params }
    );
    return response.data;
  },

  async getListing(listingId: string, token: string): Promise<Listing> {
    const response = await marketplaceAxios.get<Listing>(
      `/marketplace/listings/${listingId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ─── Student: Photo upload ─────────────────────────────────────────

  async uploadPhotos(files: File[], token: string): Promise<UploadedPhoto[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("photos", file);
    }

    const response = await marketplaceAxios.post<UploadedPhoto[]>(
      "/marketplace/uploads/photos",
      formData,
      {
        headers: {
          ...authHeaders(token),
          // Content-Type intentionally omitted — axios sets multipart boundary automatically
        },
        timeout: 60000,
      }
    );
    return response.data;
  },

  // ─── Student: Listing CRUD ─────────────────────────────────────────

  async createListing(payload: CreateListingPayload, token: string): Promise<Listing> {
    const response = await marketplaceAxios.post<Listing>(
      "/marketplace/listings",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async getMyListings(token: string): Promise<Listing[]> {
    const response = await marketplaceAxios.get<Listing[]>(
      "/marketplace/listings/mine",
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async updateListing(
    listingId: string,
    payload: UpdateListingPayload,
    token: string
  ): Promise<Listing> {
    const response = await marketplaceAxios.patch<Listing>(
      `/marketplace/listings/${listingId}`,
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async updateListingStatus(
    listingId: string,
    payload: UpdateListingStatusPayload,
    token: string
  ): Promise<Listing> {
    const response = await marketplaceAxios.patch<Listing>(
      `/marketplace/listings/${listingId}/status`,
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async deleteListing(listingId: string, token: string): Promise<{ message: string }> {
    const response = await marketplaceAxios.delete<{ message: string }>(
      `/marketplace/listings/${listingId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ─── Student: Conversations ────────────────────────────────────────

  async startConversation(listingId: string, token: string): Promise<Conversation> {
    const response = await marketplaceAxios.post<Conversation>(
      `/marketplace/listings/${listingId}/conversations`,
      null,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async getConversationUnreadCount(token: string): Promise<number> {
    const response = await marketplaceAxios.get<{ count: number }>(
      "/marketplace/conversations/unread-count",
      { headers: authHeaders(token) }
    );
    return response.data.count;
  },

  async getConversations(token: string): Promise<Conversation[]> {
    const response = await marketplaceAxios.get<Conversation[]>(
      "/marketplace/conversations",
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async getConversation(conversationId: string, token: string): Promise<Conversation> {
    const response = await marketplaceAxios.get<Conversation>(
      `/marketplace/conversations/${conversationId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async getMessages(conversationId: string, token: string): Promise<Message[]> {
    const response = await marketplaceAxios.get<Message[]>(
      `/marketplace/conversations/${conversationId}/messages`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async markMessagesRead(conversationId: string, token: string): Promise<void> {
    await marketplaceAxios.patch(
      `/marketplace/conversations/${conversationId}/messages/read`,
      null,
      { headers: authHeaders(token) }
    );
  },

  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload,
    token: string
  ): Promise<Message> {
    const response = await marketplaceAxios.post<Message>(
      `/marketplace/conversations/${conversationId}/messages`,
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // ─── Admin ─────────────────────────────────────────────────────────

  async getAdminListings(token: string): Promise<Listing[]> {
    const response = await marketplaceAxios.get<Listing[]>(
      "/marketplace/admin/listings",
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async adminRemoveListing(
    listingId: string,
    token: string
  ): Promise<{ message: string }> {
    const response = await marketplaceAxios.delete<{ message: string }>(
      `/marketplace/admin/listings/${listingId}`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },
};
