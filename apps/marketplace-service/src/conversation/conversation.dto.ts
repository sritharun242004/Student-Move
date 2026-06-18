// ---- Input DTOs ----

export interface CreateConversationDto {
  listingId: string;
}

export interface SendMessageDto {
  content: string;
}

// ---- View types ----

export interface MessageView {
  id: string;
  conversationId: string;
  senderStudentId: number;
  content: string;
  readAt?: Date;
  createdAt: Date;
}

export interface ConversationView {
  id: string;
  listingId: string;
  listingTitle?: string;
  listingFirstPhotoUrl?: string;
  buyerStudentId: number;
  sellerStudentId: number;
  unreadCount: number;
  createdAt: Date;
  lastMessage?: MessageView;
}
