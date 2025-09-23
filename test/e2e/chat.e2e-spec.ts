import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import Redis from 'ioredis';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('/chat (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const redis = new Redis() as any;
    await redis.rpush('docs:index', 'pix-taxas');
    await redis.hset('doc:pix-taxas', {
      url: 'https://ajuda.infinitepay.io/hc/pt-br/articles/pix-taxas',
      content: 'PIX no InfinitePay: recebimentos são instantâneos. Para empresas, podem existir taxas.',
    });
  
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('fluxo KnowledgeAgent', async () => {
    const res = await request(app.getHttpServer())
      .post('/chat')
      .send({ message: 'quais as taxas do pix para empresa?', user_id: 'u2', conversation_id: 'c2' })
      .expect(201);
  
    expect(res.body.agent_workflow[0].decision).toBe('KnowledgeAgent');
    expect(res.body.response.toLowerCase()).toContain('pix');
  });

  afterAll(async () => {
    await app.close();
  });

  it('fluxo MathAgent', async () => {
    const res = await request(app.getHttpServer())
      .post('/chat')
      .send({ message: '65 x 3.11', user_id: 'u1', conversation_id: 'c1' })
      .expect(201);

    expect(res.body.agent_workflow[0].decision).toBe('MathAgent');
    expect(res.body.response).toContain('Resultado');
  });

  it('valida mensagem vazia', async () => {
    await request(app.getHttpServer())
      .post('/chat')
      .send({ message: '   ', user_id: 'u1', conversation_id: 'c1' })
      .expect(400);
  });
});
