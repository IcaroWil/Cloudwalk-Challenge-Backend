import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.provider';
import { RetrieverPort, RetrievedDoc } from '../domain/retrieval.port';

@Injectable()
export class RedisRetriever implements RetrieverPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private indexKey = 'docs:index';
  private docKey = (id: string) => `doc:${id}`;

  async search(query: string, k = 3): Promise<RetrievedDoc[]> {
    const q = (query ?? '').toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\W+/).filter(Boolean);

    const ids = await this.redis.lrange(this.indexKey, 0, -1);
    if (ids.length === 0) return [];

    const docs = await Promise.all(
      ids.map(async (id) => {
        const d = await this.redis.hgetall(this.docKey(id));
        return { id, url: d.url, content: d.content } as RetrievedDoc;
      }),
    );

    const ranked = docs
      .map((d) => ({
        ...d,
        score: tokens.reduce((acc, t) => acc + (d.content.toLowerCase().includes(t) ? 1 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score);

    const top = ranked.filter((d) => d.score > 0).slice(0, k).map(({ score, ...rest }) => rest);
    return top.length ? top : docs.slice(0, Math.min(k, docs.length));
  }
}
