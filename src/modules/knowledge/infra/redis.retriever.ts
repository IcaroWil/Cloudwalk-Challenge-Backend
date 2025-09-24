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

function stem(t: string): string {
  let s = t;
  s = s.replace(/(coes)$/g, 'cao'); 
  s = s.replace(/(oes)$/g, 'ao');
  s = s.replace(/(s|es)$/g, '');
  s = s.replace(/(mente)$/g, '');
  s = s.replace(/(r|ar|er|ir)$/g, ''); 
  return s;
}

function tokenize(q: string): string[] {
  return normalize(q).split(' ').filter(Boolean).map(stem);
}

function overlap(a: Set<string>, b: string[] | Set<string>) {
  const bb = b instanceof Set ? b : new Set(b);
  let k = 0; for (const t of bb) if (a.has(t)) k++;
  return k;
}

const INTENT = {
  link_pagamento: {
    any: [
      'link pagamento', 'link cobranca',
      'gerar link', 'enviar link', 'receber link', 'cobrar link',
      'link de pagar', 'link de receber',
    ],
    must: [
      ['link','pagamento'],
      ['gerar','link'],
      ['enviar','link'],
      ['receber','link'],
    ],
  },
  pix_taxas: {
    any: ['pix taxa', 'pix tarifas', 'taxa pix', 'tarifa pix', 'percentual pix', 'custo pix'],
    must: [['pix','taxa'], ['pix','tarifa']],
  },
  maquininha_tarifas: {
    any: [
      'maquininha taxa', 'maquineta taxa', 'maquina cartao taxa',
      'tarifas maquina', 'taxas maquininha', 'custo maquininha',
    ],
    must: [['maquininha','taxa'], ['maquina','taxa'], ['maquineta','taxa']],
  },
} as const;

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

  private async fetchOne(id: keyof typeof INTENT): Promise<RetrievedDoc | null> {
    const d = await this.redis.hgetall(this.docKey(id));
    if (!d || (!d.url && !d.content)) return null;
    return { id, url: d.url, content: d.content } as RetrievedDoc;
  }

  async search(query: string, k = 3): Promise<RetrievedDoc[]> {
    const qTokens = tokenize(query);
    if (!qTokens.length) return [];
    const qSet = new Set(qTokens);

    const decide = async (id: keyof typeof INTENT) => {
      const cfg = INTENT[id];

      const anyHit = cfg.any.some(phrase => overlap(qSet, tokenize(phrase)) >= 2);
      const mustHit = cfg.must.some(group => overlap(qSet, group.map(stem)) >= group.length);

      if (anyHit || mustHit) {
        const d = await this.fetchOne(id);
        if (d) return [d];
      }
      return null;
    };

    for (const id of ['link_pagamento','pix_taxas','maquininha_tarifas'] as const) {
      const got = await decide(id);
      if (got) return got;
    }

    const docs = await this.getAllDocs();
    if (!docs.length) return [];

    const ranked = docs
      .map(d => {
        const contentTokens = new Set(tokenize(d.content));
        const score = overlap(contentTokens, qSet);
        return { ...d, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = ranked.filter(d => d.score > 0).slice(0, k).map(({ score, ...rest }) => rest);
    return top.length ? top : docs.slice(0, Math.min(k, docs.length));
  }
}
