import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './../src/app.module';

/**
 * Smoke test: boots the full AppModule and asserts the Swagger reference
 * route responds.
 *
 * Requirements to run (AppModule connects to real infrastructure on boot):
 *   - PostgreSQL reachable with the DATABASE_* settings from .env
 *   - Redis reachable with the REDIS_* settings from .env
 *   - all env vars required by src/config/validation.ts present in .env
 * On a dev machine with local Postgres/Redis and a populated .env,
 * `npm run test:e2e` (or `pnpm test:e2e`) passes as-is.
 *
 * Note: the app is intentionally NOT closed after the run — closing the
 * BullMQ module makes its Redis connection emit an uncatchable
 * "Connection is closed" error that crashes the Jest worker. The
 * `test:e2e` script uses --forceExit to terminate with open handles.
 */
describe('App (e2e smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    initializeTransactionalContext();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror the Swagger setup from src/main.ts (it lives in bootstrap,
    // not in AppModule, so the testing module does not get it for free).
    const config = new DocumentBuilder()
      .setTitle('Court Plus API')
      .setDescription('REST API Reference for Court Plus')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/reference/api', app, documentFactory, {
      jsonDocumentUrl: '/api-json',
    });

    await app.init();
  }, 60000);

  it('/reference/api (GET) serves the Swagger reference', () => {
    return request(app.getHttpServer()).get('/reference/api').expect(200);
  });
});
