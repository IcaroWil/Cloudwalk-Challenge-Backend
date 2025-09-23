import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const REDIS = Symbol('REDIS');

export const redisProvider: Provider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = config.get<number>('REDIS_PORT');
    const password = config.get<string>('REDIS_PASSWORD') || undefined;

    const isTest = process.env.NODE_ENV === 'test';

    const client = new Redis({
      host,
      port,
      password,
      // no mock, offlineQueue padrão é false -> força true
      enableOfflineQueue: true,
      // manter lazyConnect no dev/prod; no teste, desliga pra evitar edge cases
      lazyConnect: !isTest,
      // no teste, evitar timeouts/retries desnecessários
      maxRetriesPerRequest: isTest ? null : 2,
    } as any);

    client.on('error', (e: any) => console.error('[redis] error', e?.message || e));
    return client;
  },
};
