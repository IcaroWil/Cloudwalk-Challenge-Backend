import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.provider';
import { RetrieverPort, RetrievedDoc } from '../domain/retrieval.port';

function normalize(pt: string): string {
  return (pt ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class RedisRetriever implements RetrieverPort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private indexKey = 'docs:index';
  private docKey = (id: string) => `doc:${id}`;

  private async getAllDocs(): Promise<RetrievedDoc[]> {
    const ids = await this.redis.lrange(this.indexKey, 0, -1);
    if (!ids?.length) return [];
    const docs = await Promise.all(
      ids.map(async (id) => {
        const d = await this.redis.hgetall(this.docKey(id));
        return { id, url: d.url, content: d.content } as RetrievedDoc;
      }),
    );
    return docs;
  }

  async search(query: string, k = 3): Promise<RetrievedDoc[]> {
    const q = normalize(query);
    if (!q) return [];

    const tokens = new Set(q.split(' '));

    const hasAny = (...ws: string[]) => ws.some((w) => tokens.has(normalize(w)));
    const hasAll = (...ws: string[]) => ws.every((w) => tokens.has(normalize(w)));

    if (hasAll('link', 'pagamento') || hasAny('gerar', 'link') && hasAny('receber', 'pagamento')) {
      const d = await this.fetchOne('link_pagamento');
      if (d) return [d];
    }

    if (hasAny('pix') && hasAny('taxa', 'taxas', 'tarifa', 'tarifas')) {
      const d = await this.fetchOne('pix_taxas');
      if (d) return [d];
    }

    if (hasAny('maquininha', 'maquina', 'maquineta', 'maquininhas') && hasAny('taxa', 'taxas', 'tarifa', 'tarifas')) {
      const d = await this.fetchOne('maquininha_tarifas');
      if (d) return [d];
    }

    const docs = await this.getAllDocs();
    if (!docs.length) return [];

    const qTokens = q.split(' ').filter(Boolean);
    const ranked = docs
      .map((d) => {
        const contentN = normalize(d.content);
        const score = qTokens.reduce((acc, t) => acc + (contentN.includes(t) ? 1 : 0), 0);
        return { ...d, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = ranked.filter((d) => d.score > 0).slice(0, k).map(({ score, ...rest }) => rest);
    return top.length ? top : docs.slice(0, Math.min(k, docs.length));
  }

  private async fetchOne(id: string): Promise<RetrievedDoc | null> {
    const d = await this.redis.hgetall(this.docKey(id));
    if (!d || (!d.url && !d.content)) return null;
    return { id, url: d.url, content: d.content } as RetrievedDoc;
  }
}