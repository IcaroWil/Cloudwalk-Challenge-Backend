import 'dotenv/config';
import Redis from 'ioredis';

function clientFromEnv() {
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const password = process.env.REDIS_PASSWORD;
  const tls = String(process.env.REDIS_TLS ?? '').toLowerCase() === 'true';
  return new Redis({
    host, port, password,
    username: 'default',
    ...(tls ? { tls: { servername: host, minVersion: 'TLSv1.2' } } : {}),
  });
}

const INDEX_KEY = 'docs:index';
const DOC = (id: string) => `doc:${id}`;

async function seed() {
  const redis = clientFromEnv();


  await redis.del(INDEX_KEY);
  await redis.lpush(INDEX_KEY, 'link_pagamento', 'pix_taxas', 'maquininha_tarifas');

  await redis.hset(DOC('link_pagamento'), {
    url: 'https://ajuda.infinitepay.io/hc/pt-br/articles/link-de-pagamento',
    content:
      'Para receber via link de pagamento, acesse o painel, gere o link e compartilhe com seu cliente.',
  });

  await redis.hset(DOC('pix_taxas'), {
    url: 'https://ajuda.infinitepay.io/hc/pt-br/articles/pix-taxas',
    content:
      'Sobre as taxas de PIX: no InfinitePay, recebimentos são instantâneos. Para empresas, podem existir taxas diferenciadas conforme volume e uso. Consulte seu painel para ver as tarifas vigentes.',
  });

  await redis.hset(DOC('maquininha_tarifas'), {
    url: 'https://ajuda.infinitepay.io/hc/pt-br/articles/tarifas-maquininha',
    content:
      'Tarifas da maquininha podem variar por bandeira e parcelamento. Confira a tabela de tarifas no painel.',
  });

  await redis.quit();
  console.log('Seeded 3 docs (link_pagamento, pix_taxas, maquininha_tarifas).');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});