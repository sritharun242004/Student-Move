export const MARKETPLACE_SERVICE_PATTERNS = {
  healthPing: 'marketplace.health.ping',

  categoryList: 'marketplace.category.list',

  listingCreate: 'marketplace.listing.create',
  listingUpdate: 'marketplace.listing.update',
  listingDelete: 'marketplace.listing.delete',
  listingGetById: 'marketplace.listing.getById',
  listingBrowse: 'marketplace.listing.browse',
  listingGetMine: 'marketplace.listing.getMine',
  listingUpdateStatus: 'marketplace.listing.updateStatus',

  listingAdminList: 'marketplace.listing.admin.list',
  listingAdminRemove: 'marketplace.listing.admin.remove',

  conversationCreate: 'marketplace.conversation.create',
  conversationListMine: 'marketplace.conversation.listMine',
  conversationGetById: 'marketplace.conversation.getById',
  conversationUnreadCount: 'marketplace.conversation.unreadCount',

  messageList: 'marketplace.message.list',
  messageSend: 'marketplace.message.send',
  messageMarkRead: 'marketplace.message.markRead',
} as const;

export interface MarketplaceUserScopedPayload<T = unknown> {
  userId: string;
  body?: T;
}

export interface MarketplaceListingActionPayload<T = unknown> {
  userId: string;
  listingId: string;
  body?: T;
}

export interface MarketplaceListingByIdPayload {
  listingId: string;
  viewerUserId?: string;
}

export interface MarketplaceBrowseListingsPayload {
  keyword?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  skip?: number;
  take?: number;
}

export interface MarketplaceConversationActionPayload<T = unknown> {
  userId: string;
  conversationId: string;
  body?: T;
}

export interface MarketplaceAdminListingActionPayload {
  listingId: string;
}
