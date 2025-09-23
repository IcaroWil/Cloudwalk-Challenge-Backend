import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import Redis from 'ioredis';

(async () => {
  const file = path.resolve(__dirname, '../data/knowledge.docs.json');
  const docs = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{id:string; url:string; content:string}>;

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  });

  const indexKey = 'docs:index';
  await redis.del(indexKey);

  for (const d of docs) {
    await redis.rpush(indexKey, d.id);
    await redis.hset(`doc:${d.id}`, { url: d.url, content: d.content });
  }

  console.log(`Seeded ${docs.length} docs.`);
  await redis.quit();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
