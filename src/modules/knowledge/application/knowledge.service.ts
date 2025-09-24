import { Inject, Injectable } from '@nestjs/common';
import type { RetrieverPort } from '../domain/retrieval.port';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject('RetrieverPort')
    private readonly retriever: RetrieverPort,
  ) {}

  async answer(question: string) {
    const started = Date.now();
    const docs = await this.retriever.search((question ?? '').trim(), 3);
    const best = docs[0];
    const execution_time = Date.now() - started;

    if (!best) {
      return {
        response: 'Não encontrei nada muito preciso. Pode reformular?',
        source: undefined,
        execution_time,
      };
    }

    const snippet =
      best.content.length > 280 ? best.content.slice(0, 280) + '…' : best.content;

    const fonte = best.url ? `\n\nFonte: ${best.url}` : '';

    return {
      response: `Sobre sua dúvida: ${snippet}${fonte}`,
      source: best.url,
      execution_time,
    };
  }
}
