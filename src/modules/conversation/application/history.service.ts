import { Inject, Injectable } from '@nestjs/common';
import type { HistoryRepository } from '../domain/history.repository';
import { Message } from '../domain/message';

@Injectable()
export class HistoryService {
  constructor(
    @Inject('HistoryRepository')
    private readonly repo: HistoryRepository,
  ) {}

  append(conversationId: string, msg: Message) {
    return this.repo.append(conversationId, msg);
  }

  list(conversationId: string, limit?: number) {
    return this.repo.list(conversationId, limit);
  }

  clear(conversationId: string) {
    return this.repo.clear(conversationId);
  }
}
