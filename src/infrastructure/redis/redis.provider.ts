import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST') ?? 'localhost';
    const port = Number(config.get<number>('REDIS_PORT') ?? 6379);
    const password = config.get<string>('REDIS_PASSWORD') ?? undefined;
    const tlsEnabled = (config.get<string>('REDIS_TLS') ?? '').toLowerCase() === 'true';

    const options: RedisOptions = {
      host,
      port,
      username: 'default',
      password,
      ...(tlsEnabled
        ? { tls: { servername: host, minVersion: 'TLSv1.2' } }
        : {}),
      connectTimeout: 10_000,
      keepAlive: 10_000,
      lazyConnect: false,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(1000 * times, 5000),
    };

    const client = new Redis(options);

    client.on('ready', () => console.log('[Redis] ready'));
    client.on('error', (err) => console.error('[Redis] error', err?.message));

    return client;
  },
};