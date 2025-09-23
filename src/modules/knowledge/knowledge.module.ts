import { Module } from '@nestjs/common';
import { KnowledgeService } from './application/knowledge.service';
import { RedisRetriever } from './infra/redis.retriever';

@Module({
  providers: [
    KnowledgeService,
    { provide: 'RetrieverPort', useClass: RedisRetriever },
  ],
  exports: [KnowledgeService, 'RetrieverPort'],
})
export class KnowledgeModule {}
