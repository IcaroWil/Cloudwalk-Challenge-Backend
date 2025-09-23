import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { RouterModule } from '../router/router.module';
import { MathModule } from '../math/math.module';
import { ConversationModule } from '../conversation/conversation.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [RouterModule, MathModule, ConversationModule, KnowledgeModule],
  controllers: [ChatController],
})
export class ChatModule {}
