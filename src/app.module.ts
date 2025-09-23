import { Module } from '@nestjs/common';
import { ConfigModule } from './common/config/config.module';
import { LoggerModule } from './common/logging/logger.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './infrastructure/redis/redis.module';

import { RouterModule } from './modules/router/router.module';
import { MathModule } from './modules/math/math.module';

import { ChatModule } from './modules/chat/chat.module';
import { ConversationModule } from './modules/conversation/conversation.module';

import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    HealthModule,
    RouterModule,
    MathModule,
    KnowledgeModule,
    ConversationModule,
    ChatModule,
  ],
})
export class AppModule {}
