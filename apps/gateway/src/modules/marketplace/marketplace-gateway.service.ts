import { Injectable } from '@nestjs/common';
import { MarketplaceServiceClient } from '../../microservices/marketplace-service.client';
import { ReelsServiceClient } from '../../microservices/reels-service.client';

@Injectable()
export class MarketplaceGatewayService {
  constructor(
    private readonly marketplaceClient: MarketplaceServiceClient,
    private readonly reelsClient: ReelsServiceClient,
  ) {}

  listCategories() {
    return this.marketplaceClient.listCategories();
  }

  createListing(userId: string, body: Record<string, unknown>) {
    return this.marketplaceClient.createListing({ userId, body });
  }

  updateListing(userId: string, listingId: string, body: Record<string, unknown>) {
    return this.marketplaceClient.updateListing({ userId, listingId, body });
  }

  deleteListing(userId: string, listingId: string) {
    return this.marketplaceClient.deleteListing({ userId, listingId });
  }

  updateListingStatus(userId: string, listingId: string, body: Record<string, unknown>) {
    return this.marketplaceClient.updateListingStatus({ userId, listingId, body });
  }

  async getListingById(listingId: string, viewerUserId?: string) {
    const listing = await this.marketplaceClient.getListingById({ listingId }) as Record<string, unknown>;
    return this.enrichWithSellerProfile(listing);
  }

  async browseListings(query: Record<string, unknown>) {
    const parseOptionalNumber = (val: unknown): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    const result = await this.marketplaceClient.browseListings({
      keyword: typeof query.keyword === 'string' ? query.keyword : undefined,
      categoryId: parseOptionalNumber(query.categoryId),
      priceMin: parseOptionalNumber(query.priceMin),
      priceMax: parseOptionalNumber(query.priceMax),
      skip: parseOptionalNumber(query.skip),
      take: parseOptionalNumber(query.take),
    }) as { items: Record<string, unknown>[]; total: number; skip: number; take: number };

    const items = await this.enrichListingsWithProfiles(result.items ?? []);
    return { ...result, items };
  }

  async getMyListings(userId: string) {
    const listings = await this.marketplaceClient.getMyListings({ userId }) as Record<string, unknown>[];
    return this.enrichListingsWithProfiles(listings);
  }

  createConversation(userId: string, listingId: string) {
    return this.marketplaceClient.createConversation({ userId, body: { listingId } });
  }

  async listMyConversations(userId: string) {
    const conversations = await this.marketplaceClient.listMyConversations({ userId }) as Record<string, unknown>[];
    return Promise.all(conversations.map((conv) => this.enrichConversationWithProfiles(conv)));
  }

  async getConversationById(userId: string, conversationId: string) {
    const conversation = await this.marketplaceClient.getConversationById({ userId, conversationId }) as Record<string, unknown>;
    return this.enrichConversationWithProfiles(conversation);
  }

  listMessages(userId: string, conversationId: string) {
    return this.marketplaceClient.listMessages({ userId, conversationId });
  }

  sendMessage(userId: string, conversationId: string, body: Record<string, unknown>) {
    return this.marketplaceClient.sendMessage({ userId, conversationId, body });
  }

  markMessagesAsRead(userId: string, conversationId: string) {
    return this.marketplaceClient.markMessagesAsRead({ userId, conversationId });
  }

  getUnreadConversationCount(userId: string) {
    return this.marketplaceClient.getUnreadConversationCount({ userId });
  }

  adminListListings() {
    return this.marketplaceClient.adminListListings();
  }

  adminRemoveListing(listingId: string) {
    return this.marketplaceClient.adminRemoveListing({ listingId });
  }

  private async enrichWithSellerProfile(
    listing: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      const profile = await this.reelsClient.getProfileByStudentId({
        studentId: String(listing.studentId),
      }) as Record<string, unknown>;
      return {
        ...listing,
        sellerProfile: {
          displayName: profile?.displayName ?? null,
          profilePhotoUrl: profile?.profilePhotoUrl ?? null,
        },
      };
    } catch {
      return { ...listing, sellerProfile: null };
    }
  }

  private enrichListingsWithProfiles(
    listings: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
    return Promise.all(listings.map((l) => this.enrichWithSellerProfile(l)));
  }

  private async enrichConversationWithProfiles(
    conversation: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const fetchProfile = async (studentId: unknown): Promise<{ displayName: string | null; profilePhotoUrl: string | null }> => {
      try {
        const profile = await this.reelsClient.getProfileByStudentId({
          studentId: String(studentId),
        }) as Record<string, unknown>;
        return {
          displayName: (profile?.displayName as string) ?? null,
          profilePhotoUrl: (profile?.profilePhotoUrl as string) ?? null,
        };
      } catch {
        return { displayName: null, profilePhotoUrl: null };
      }
    };

    const [sellerProfile, buyerProfile] = await Promise.all([
      fetchProfile(conversation.sellerStudentId),
      fetchProfile(conversation.buyerStudentId),
    ]);

    return { ...conversation, sellerProfile, buyerProfile };
  }
}
