import {
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  MARKETPLACE_SERVICE_PATTERNS,
  MarketplaceAdminListingActionPayload,
  MarketplaceBrowseListingsPayload,
  MarketplaceConversationActionPayload,
  MarketplaceListingActionPayload,
  MarketplaceUserScopedPayload,
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';

export const MARKETPLACE_SERVICE_CLIENT = 'MARKETPLACE_SERVICE_CLIENT';

@Injectable()
export class MarketplaceServiceClient {
  constructor(
    @Inject(MARKETPLACE_SERVICE_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  healthPing() {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.healthPing);
  }

  listCategories() {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.categoryList);
  }

  createListing(payload: MarketplaceUserScopedPayload<Record<string, unknown>>) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingCreate, payload);
  }

  updateListing(payload: MarketplaceListingActionPayload<Record<string, unknown>>) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingUpdate, payload);
  }

  deleteListing(payload: MarketplaceListingActionPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingDelete, payload);
  }

  updateListingStatus(payload: MarketplaceListingActionPayload<Record<string, unknown>>) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingUpdateStatus, payload);
  }

  getListingById(payload: { listingId: string }) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingGetById, payload);
  }

  browseListings(payload: MarketplaceBrowseListingsPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingBrowse, payload);
  }

  getMyListings(payload: MarketplaceUserScopedPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingGetMine, payload);
  }

  adminListListings() {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingAdminList);
  }

  adminRemoveListing(payload: MarketplaceAdminListingActionPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.listingAdminRemove, payload);
  }

  createConversation(payload: MarketplaceUserScopedPayload<Record<string, unknown>>) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.conversationCreate, payload);
  }

  listMyConversations(payload: MarketplaceUserScopedPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.conversationListMine, payload);
  }

  getConversationById(payload: MarketplaceConversationActionPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.conversationGetById, payload);
  }

  listMessages(payload: MarketplaceConversationActionPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.messageList, payload);
  }

  sendMessage(payload: MarketplaceConversationActionPayload<Record<string, unknown>>) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.messageSend, payload);
  }

  markMessagesAsRead(payload: MarketplaceConversationActionPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.messageMarkRead, payload);
  }

  getUnreadConversationCount(payload: MarketplaceUserScopedPayload) {
    return this.send(MARKETPLACE_SERVICE_PATTERNS.conversationUnreadCount, payload);
  }

  private send<TResult = unknown, TPayload = unknown>(
    pattern: string,
    payload?: TPayload,
  ): Promise<TResult> {
    const safePayload = (payload ?? ({} as TPayload)) as TPayload;

    return firstValueFrom(this.client.send<TResult, TPayload>(pattern, safePayload)).catch(
      (error: unknown) => {
        throw this.mapRpcErrorToHttpException(error);
      },
    );
  }

  private mapRpcErrorToHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const raw = this.extractRpcErrorPayload(error);
    const statusCode = this.readStatusCode(raw);
    const message = this.readMessage(raw);

    if (statusCode) {
      return new HttpException({ statusCode, message }, statusCode);
    }

    return new BadGatewayException(message ?? 'Request to marketplace service failed');
  }

  private extractRpcErrorPayload(error: unknown): unknown {
    if (!error || typeof error !== 'object') {
      return error;
    }

    const record = error as Record<string, unknown>;
    return record.error ?? record.response ?? record;
  }

  private readStatusCode(payload: unknown): number | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const statusCode = (payload as Record<string, unknown>).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }

    const status = (payload as Record<string, unknown>).status;
    if (typeof status === 'number') {
      return status;
    }

    return undefined;
  }

  private readMessage(payload: unknown): string | string[] {
    if (!payload || typeof payload !== 'object') {
      return 'Internal server error';
    }

    const message = (payload as Record<string, unknown>).message;

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message;
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Internal server error';
  }
}
