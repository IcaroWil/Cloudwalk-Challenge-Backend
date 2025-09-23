import { Module } from '@nestjs/common';
import { HistoryService } from './application/history.service';
import { HistoryRedisRepository } from './infra/history.redis.repository';

@Module({
  providers: [
    HistoryService,
    { provide: 'HistoryRepository', useClass: HistoryRedisRepository },
  ],
  exports: [HistoryService, 'HistoryRepository'],
})
export class ConversationModule {}
