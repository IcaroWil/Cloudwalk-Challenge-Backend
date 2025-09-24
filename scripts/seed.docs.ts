import Redis from 'ioredis';

const host = process.env.REDIS_HOST ?? 'localhost';
const port = Number(process.env.REDIS_PORT ?? 6379);
const password = process.env.REDIS_PASSWORD ?? '';
const tlsEnabled = (process.env.REDIS_TLS ?? '').toLowerCase() === 'true';

const redis = new Redis({
  host,
  port,
  username: 'default',
  password,
  ...(tlsEnabled ? { tls: { servername: host } } : {}),
  connectTimeout: 10_000,
  keepAlive: 10_000,
  lazyConnect: false,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(1000 * times, 5000),
  enableOfflineQueue: true,
  enableReadyCheck: true,
});

async function main() {
  const docs: Record<string, string> = {
    'kb:pix:taxas':
      'Sobre sua dúvida: PIX no InfinitePay: recebimentos são instantâneos. Para empresas, podem existir taxas diferenciadas conforme volume e uso. Consulte seu painel para ver as tarifas vigentes.',
    'kb:link:pagamento':
      'Para receber via link de pagamento, acesse o painel, gere o link e compartilhe com seu cliente.',
    'kb:maquininha:tarifas':
      'As tarifas podem variar conforme volume e uso. Consulte seu painel para ver as tarifas vigentes.',
  };

  for (const [k, v] of Object.entries(docs)) {
    await redis.set(k, v);
  }

  console.log(`Seeded ${Object.keys(docs).length} docs.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});