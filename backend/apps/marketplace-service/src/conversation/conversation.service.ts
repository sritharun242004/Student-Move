import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { NotificationService } from '@app/notifications';
import { Conversation } from '../domain/entities/conversation.entity';
import { Listing, ListingStatus } from '../domain/entities/listing.entity';
import { Message } from '../domain/entities/message.entity';
import type {
  ConversationView,
  CreateConversationDto,
  MessageView,
  SendMessageDto,
} from './conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    private readonly notificationService: NotificationService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationView> {
    const buyerStudentId = Number(userId);

    const listing = await this.listingRepo.findOne({ where: { id: dto.listingId }, relations: ['photos'] });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is no longer active');
    }
    if (listing.studentId === buyerStudentId) {
      throw new BadRequestException('You cannot start a conversation on your own listing');
    }

    const existing = await this.conversationRepo.findOne({
      where: { listingId: dto.listingId, buyerStudentId },
    });
    if (existing) return this.toConversationView(existing, listing, 0);

    const conversation = this.conversationRepo.create({
      listingId: dto.listingId,
      buyerStudentId,
      sellerStudentId: listing.studentId,
    });

    const saved = await this.conversationRepo.save(conversation);

    void this.notificationService.sendNotification({
      recipient_id: String(listing.studentId),
      notification_type: 'marketplace',
      title: 'New Conversation',
      message: `A student is interested in your listing '${listing.title}'.`,
      metadata: { conversationId: saved.id, listingId: listing.id },
    });

    return this.toConversationView(saved, listing, 0);
  }

  async getConversationById(userId: string, conversationId: string): Promise<ConversationView> {
    const conversation = await this.findConversationOrThrow(conversationId);
    this.assertParticipant(conversation, userId);

    const studentId = Number(userId);
    const [lastMessage, listing, unreadCount] = await Promise.all([
      this.messageRepo.findOne({
        where: { conversationId: conversation.id },
        order: { createdAt: 'DESC' },
      }),
      this.listingRepo.findOne({
        where: { id: conversation.listingId },
        relations: ['photos'],
      }),
      this.messageRepo.count({
        where: { conversationId: conversation.id, senderStudentId: Not(studentId), readAt: IsNull() },
      }),
    ]);

    return this.toConversationView(conversation, listing ?? undefined, unreadCount, lastMessage ?? undefined);
  }

  async listMyConversations(userId: string): Promise<ConversationView[]> {
    const studentId = Number(userId);

    const conversations = await this.conversationRepo
      .createQueryBuilder('conv')
      .where('conv.buyerStudentId = :id OR conv.sellerStudentId = :id', { id: studentId })
      .orderBy('conv.createdAt', 'DESC')
      .getMany();

    const views = await Promise.all(
      conversations.map(async (conv) => {
        const [lastMessage, listing, unreadCount] = await Promise.all([
          this.messageRepo.findOne({
            where: { conversationId: conv.id },
            order: { createdAt: 'DESC' },
          }),
          this.listingRepo.findOne({
            where: { id: conv.listingId },
            relations: ['photos'],
          }),
          this.messageRepo.count({
            where: { conversationId: conv.id, senderStudentId: Not(studentId), readAt: IsNull() },
          }),
        ]);
        return this.toConversationView(conv, listing ?? undefined, unreadCount, lastMessage ?? undefined);
      }),
    );

    return views;
  }

  async markMessagesAsRead(userId: string, conversationId: string): Promise<{ markedCount: number }> {
    const conversation = await this.findConversationOrThrow(conversationId);
    this.assertParticipant(conversation, userId);

    const studentId = Number(userId);
    const result = await this.messageRepo.update(
      {
        conversationId,
        senderStudentId: Not(studentId),
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );

    return { markedCount: result.affected ?? 0 };
  }

  async getUnreadConversationCount(userId: string): Promise<{ count: number }> {
    const studentId = Number(userId);

    const count = await this.conversationRepo
      .createQueryBuilder('conv')
      .innerJoin(
        'conv.messages',
        'msg',
        'msg.senderStudentId != :sid AND msg.readAt IS NULL',
        { sid: studentId },
      )
      .where('conv.buyerStudentId = :sid OR conv.sellerStudentId = :sid', { sid: studentId })
      .getCount();

    return { count };
  }

  async listMessages(userId: string, conversationId: string): Promise<MessageView[]> {
    const conversation = await this.findConversationOrThrow(conversationId);
    this.assertParticipant(conversation, userId);

    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return messages.map((m) => this.toMessageView(m));
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    const conversation = await this.findConversationOrThrow(conversationId);
    this.assertParticipant(conversation, userId);

    const listing = await this.listingRepo.findOne({ where: { id: conversation.listingId } });
    if (listing?.status === ListingStatus.REMOVED) {
      throw new BadRequestException('Cannot send messages for a removed listing');
    }

    const message = this.messageRepo.create({
      conversationId,
      senderStudentId: Number(userId),
      content: dto.content,
    });

    const saved = await this.messageRepo.save(message);

    const recipientStudentId =
      Number(userId) === conversation.buyerStudentId
        ? conversation.sellerStudentId
        : conversation.buyerStudentId;

    void this.notificationService.sendNotification({
      recipient_id: String(recipientStudentId),
      notification_type: 'marketplace',
      title: 'New Message',
      message: 'You have a new message in one of your conversations.',
      metadata: { conversationId, messageId: saved.id },
    });

    return this.toMessageView(saved);
  }

  private async findConversationOrThrow(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  private assertParticipant(conversation: Conversation, userId: string): void {
    const studentId = Number(userId);
    if (
      conversation.buyerStudentId !== studentId &&
      conversation.sellerStudentId !== studentId
    ) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
  }

  private toConversationView(conversation: Conversation, listing: Listing | undefined, unreadCount: number, lastMessage?: Message): ConversationView {
    const firstPhoto = listing?.photos
      ?.slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)[0];
    return {
      id: conversation.id,
      listingId: conversation.listingId,
      listingTitle: listing?.title,
      listingFirstPhotoUrl: firstPhoto?.photoUrl,
      buyerStudentId: conversation.buyerStudentId,
      sellerStudentId: conversation.sellerStudentId,
      unreadCount,
      createdAt: conversation.createdAt,
      lastMessage: lastMessage ? this.toMessageView(lastMessage) : undefined,
    };
  }

  private toMessageView(message: Message): MessageView {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderStudentId: message.senderStudentId,
      content: message.content,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }
}
