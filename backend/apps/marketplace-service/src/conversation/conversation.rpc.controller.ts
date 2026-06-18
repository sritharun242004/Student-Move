import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MARKETPLACE_SERVICE_PATTERNS } from '@app/contracts';
import type {
  MarketplaceConversationActionPayload,
  MarketplaceUserScopedPayload,
} from '@app/contracts';
import type { CreateConversationDto, SendMessageDto } from './conversation.dto';
import { ConversationService } from './conversation.service';

@Controller()
export class ConversationRpcController {
  constructor(private readonly conversationService: ConversationService) {}

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.conversationCreate)
  createConversation(@Payload() payload: MarketplaceUserScopedPayload<CreateConversationDto>) {
    return this.conversationService.createConversation(payload.userId, payload.body!);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.conversationListMine)
  listMyConversations(@Payload() payload: MarketplaceUserScopedPayload) {
    return this.conversationService.listMyConversations(payload.userId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.conversationGetById)
  getConversationById(@Payload() payload: MarketplaceConversationActionPayload) {
    return this.conversationService.getConversationById(payload.userId, payload.conversationId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.messageList)
  listMessages(@Payload() payload: MarketplaceConversationActionPayload) {
    return this.conversationService.listMessages(payload.userId, payload.conversationId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.messageSend)
  sendMessage(@Payload() payload: MarketplaceConversationActionPayload<SendMessageDto>) {
    return this.conversationService.sendMessage(payload.userId, payload.conversationId, payload.body!);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.messageMarkRead)
  markMessagesAsRead(@Payload() payload: MarketplaceConversationActionPayload) {
    return this.conversationService.markMessagesAsRead(payload.userId, payload.conversationId);
  }

  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.conversationUnreadCount)
  getUnreadConversationCount(@Payload() payload: MarketplaceUserScopedPayload) {
    return this.conversationService.getUnreadConversationCount(payload.userId);
  }
}
