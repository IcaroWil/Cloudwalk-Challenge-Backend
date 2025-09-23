import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from '../../../infrastructure/redis/redis.provider';
import { HistoryRepository } from '../domain/history.repository';
import { Message } from '../domain/message';

@Injectable()
export class HistoryRedisRepository implements HistoryRepository {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private key(id: string) { return `history:${id}`; }

  async append(conversationId: string, msg: Message): Promise<void> {
    await this.redis.rpush(this.key(conversationId), JSON.stringify(msg));
    await this.redis.expire(this.key(conversationId), 7 * 24 * 3600);
  }

  async list(conversationId: string, limit = 50): Promise<Message[]> {
    const len = await this.redis.llen(this.key(conversationId));
    const start = Math.max(0, len - limit);
    const raw = await this.redis.lrange(this.key(conversationId), start, -1);
    return raw.map((s) => JSON.parse(s));
  }

  async clear(conversationId: string): Promise<void> {
    await this.redis.del(this.key(conversationId));
  }
}
