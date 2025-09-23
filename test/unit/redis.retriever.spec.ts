import { RedisRetriever } from '../../src/modules/knowledge/infra/redis.retriever';

jest.mock('ioredis', () => require('ioredis-mock'));
import Redis from 'ioredis';

describe('RedisRetriever', () => {
  it('rankeia por contagem de tokens', async () => {
    const redis = new Redis() as any;
    await redis.rpush('docs:index', 'a', 'b');
    await redis.hset('doc:a', { url: 'u/a', content: 'pix tarifas instantâneo empresa' });
    await redis.hset('doc:b', { url: 'u/b', content: 'parcelamento maquininha antecipado' });

    const r = new RedisRetriever(redis);
    const out = await r.search('pix empresa', 1);
    expect(out[0].url).toBe('u/a');
  });
});
