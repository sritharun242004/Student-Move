import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Category } from '../domain/entities/category.entity';
import { Listing, ListingStatus } from '../domain/entities/listing.entity';
import { ListingPhoto } from '../domain/entities/listing-photo.entity';
import type {
  BrowseListingsDto,
  CategoryView,
  CreateListingDto,
  ListingPhotoView,
  ListingView,
  PaginatedListingView,
  UpdateListingDto,
  UpdateListingStatusDto,
} from './listing.dto';

@Injectable()
export class ListingService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly photoRepo: Repository<ListingPhoto>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async listCategories(): Promise<CategoryView[]> {
    const cats = await this.categoryRepo.find({ order: { id: 'ASC' } });
    return cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }));
  }

  async createListing(userId: string, dto: CreateListingDto): Promise<ListingView> {
    const studentId = Number(userId);
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.listingType === 'STOCK' && (dto.totalStock == null || dto.totalStock <= 0)) {
      throw new BadRequestException('totalStock is required and must be positive for STOCK listings');
    }

    const listing = this.listingRepo.create({
      studentId,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      location: dto.location,
      categoryId: dto.categoryId,
      listingType: dto.listingType,
      totalStock: dto.totalStock,
      contactNumber: dto.contactNumber,
      status: ListingStatus.ACTIVE,
    });

    const saved = await this.listingRepo.save(listing);

    if (dto.photoUrls?.length) {
      const photos = dto.photoUrls.map((url, index) =>
        this.photoRepo.create({ listingId: saved.id, photoUrl: url, displayOrder: index }),
      );
      await this.photoRepo.save(photos);
    }

    return this.getListingById(saved.id);
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto): Promise<ListingView> {
    const listing = await this.findListingOrThrow(listingId);
    this.assertOwner(listing, userId);

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      listing.categoryId = dto.categoryId;
    }

    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price;
    if (dto.location !== undefined) listing.location = dto.location;
    if (dto.totalStock !== undefined) listing.totalStock = dto.totalStock;
    if (dto.contactNumber !== undefined) listing.contactNumber = dto.contactNumber;

    await this.listingRepo.save(listing);

    if (dto.photoUrls !== undefined) {
      await this.photoRepo.delete({ listingId });
      if (dto.photoUrls.length) {
        const photos = dto.photoUrls.map((url, index) =>
          this.photoRepo.create({ listingId, photoUrl: url, displayOrder: index }),
        );
        await this.photoRepo.save(photos);
      }
    }

    return this.getListingById(listingId);
  }

  async deleteListing(userId: string, listingId: string): Promise<{ success: boolean }> {
    const listing = await this.findListingOrThrow(listingId);
    this.assertOwner(listing, userId);
    await this.listingRepo.remove(listing);
    return { success: true };
  }

  async updateListingStatus(
    userId: string,
    listingId: string,
    dto: UpdateListingStatusDto,
  ): Promise<ListingView> {
    const listing = await this.findListingOrThrow(listingId);
    this.assertOwner(listing, userId);
    listing.status = dto.status;
    await this.listingRepo.save(listing);
    return this.getListingById(listingId);
  }

  async getListingById(listingId: string): Promise<ListingView> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: ['category', 'photos'],
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.toView(listing);
  }

  async browseListings(dto: BrowseListingsDto): Promise<PaginatedListingView> {
    const take = Math.min(dto.take ?? 20, 100);
    const skip = dto.skip ?? 0;

    const qb = this.listingRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoinAndSelect('listing.photos', 'photos')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE });

    if (dto.keyword) {
      qb.andWhere(
        '(listing.title ILIKE :kw OR listing.description ILIKE :kw)',
        { kw: `%${dto.keyword}%` },
      );
    }

    if (dto.categoryId !== undefined) {
      const subcategories = await this.categoryRepo.find({
        where: { parentId: dto.categoryId },
        select: ['id'],
      });
      const categoryIds =
        subcategories.length > 0
          ? [dto.categoryId, ...subcategories.map((c) => c.id)]
          : [dto.categoryId];
      qb.andWhere('listing.categoryId IN (:...cats)', { cats: categoryIds });
    }

    if (dto.priceMin !== undefined) {
      qb.andWhere('listing.price >= :pmin', { pmin: dto.priceMin });
    }

    if (dto.priceMax !== undefined) {
      qb.andWhere('listing.price <= :pmax', { pmax: dto.priceMax });
    }

    qb.orderBy('listing.createdAt', 'DESC').skip(skip).take(take);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((l) => this.toView(l)), total, skip, take };
  }

  async getMyListings(userId: string): Promise<ListingView[]> {
    const listings = await this.listingRepo.find({
      where: { studentId: Number(userId) },
      relations: ['category', 'photos'],
      order: { createdAt: 'DESC' },
    });
    return listings.map((l) => this.toView(l));
  }

  async adminListListings(): Promise<ListingView[]> {
    const listings = await this.listingRepo.find({
      relations: ['category', 'photos'],
      order: { createdAt: 'DESC' },
    });
    return listings.map((l) => this.toView(l));
  }

  async adminRemoveListing(listingId: string): Promise<void> {
    const listing = await this.findListingOrThrow(listingId);
    listing.status = ListingStatus.REMOVED;
    await this.listingRepo.save(listing);
  }

  private async findListingOrThrow(listingId: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  private assertOwner(listing: Listing, userId: string): void {
    if (listing.studentId !== Number(userId)) {
      throw new ForbiddenException('You do not own this listing');
    }
  }

  private toView(listing: Listing): ListingView {
    const photos: ListingPhotoView[] = (listing.photos ?? [])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => ({ id: p.id, photoUrl: p.photoUrl, displayOrder: p.displayOrder }));

    return {
      id: listing.id,
      studentId: listing.studentId,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      location: listing.location,
      category: {
        id: listing.category.id,
        name: listing.category.name,
        parentId: listing.category.parentId,
      },
      listingType: listing.listingType,
      totalStock: listing.totalStock,
      soldItems: listing.soldItems,
      contactNumber: listing.contactNumber,
      status: listing.status,
      photos,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
