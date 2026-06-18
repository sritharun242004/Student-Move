import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../domain/entities/conversation.entity';
import { Listing } from '../domain/entities/listing.entity';
import { Message } from '../domain/entities/message.entity';
import { ConversationRpcController } from './conversation.rpc.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Listing])],
  controllers: [ConversationRpcController],
  providers: [ConversationService],
})
export class ConversationModule {}
