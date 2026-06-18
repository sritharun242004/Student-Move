import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MARKETPLACE_SERVICE_PATTERNS } from '@app/contracts';
import type {
  MarketplaceAdminListingActionPayload,
  MarketplaceBrowseListingsPayload,
  MarketplaceListingActionPayload,
  MarketplaceUserScopedPayload,
} from '@app/contracts';
import type {
  BrowseListingsDto,
  CreateListingDto,
  UpdateListingDto,
  UpdateListingStatusDto,
} from './listing.dto';
import { ListingService } from './listing.service';

@Controller()
export class ListingRpcController {
  constructor(private readonly listingService: ListingService) {}

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.categoryList)
  listCategories() {
    return this.listingService.listCategories();
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingCreate)
  createListing(@Payload() payload: MarketplaceUserScopedPayload<CreateListingDto>) {
    return this.listingService.createListing(payload.userId, payload.body!);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingUpdate)
  updateListing(@Payload() payload: MarketplaceListingActionPayload<UpdateListingDto>) {
    return this.listingService.updateListing(payload.userId, payload.listingId, payload.body ?? {});
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingDelete)
  deleteListing(@Payload() payload: MarketplaceListingActionPayload) {
    return this.listingService.deleteListing(payload.userId, payload.listingId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingUpdateStatus)
  updateListingStatus(
    @Payload() payload: MarketplaceListingActionPayload<UpdateListingStatusDto>,
  ) {
    return this.listingService.updateListingStatus(payload.userId, payload.listingId, payload.body!);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingGetById)
  getListingById(@Payload() payload: { listingId: string }) {
    return this.listingService.getListingById(payload.listingId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingBrowse)
  browseListings(@Payload() payload: MarketplaceBrowseListingsPayload) {
    return this.listingService.browseListings(payload);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingGetMine)
  getMyListings(@Payload() payload: MarketplaceUserScopedPayload) {
    return this.listingService.getMyListings(payload.userId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingAdminList)
  adminListListings() {
    return this.listingService.adminListListings();
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.listingAdminRemove)
  adminRemoveListing(@Payload() payload: MarketplaceAdminListingActionPayload) {
    return this.listingService.adminRemoveListing(payload.listingId);
  }
}
