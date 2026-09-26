import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './modules/shared/exception-filter';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bodyParser: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService);
  const isProduction = config.get('env') === 'production';
  const logger = new Logger('Bootstrap');

  // The API sits behind Caddy (and behind Vercel/CloudFront for some paths).
  // Without this, Express reports the proxy's container IP as req.ip, which
  // collapses every caller into ONE rate-limit bucket — six failed logins from
  // anyone would lock out the entire platform for an hour. It also makes
  // req.ip trustworthy so client-supplied X-Forwarded-For cannot be spoofed.
  // '1' = trust exactly one proxy hop (Caddy). Raise only if more are added.
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Strip body properties that are not declared on the DTO to
      // prevent mass assignment (e.g. role/tenantId/stat overrides).
      whitelist: true,
      // NOT enabling forbidNonWhitelisted yet. It is the correct end state —
      // silent stripping hides client/server contract drift — but flipping it
      // would 400 every request from already-shipped mobile builds that send
      // any extra field. Enable it once client payloads have been audited
      // against the DTOs (see the API-contract section of the audit).
      //
      // disableErrorMessages is likewise NOT set: HttpExceptionFilter derives
      // the client-facing error code from message[0], and the apps map those
      // codes to localized strings. Suppressing messages would break the
      // localized error system rather than hardening anything.
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  app.use(
    compression({
      // The notification stream is text/event-stream. compression() buffers
      // output until the response ends, so a compressed stream would never
      // deliver a single event. Everything else is compressed as before.
      filter: (req, res) =>
        req.path?.startsWith('/notifications/stream')
          ? false
          : compression.filter(req, res),
    }),
  );

  // Explicit allowlist. Previously enableCors() with no options reflected any
  // origin. Auth is Bearer-token (no cookies), so this was not a session-riding
  // hole, but it let any site drive the API with a stolen token and made the
  // surface unnecessarily broad.
  const corsOrigins = (config.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    // Mobile apps and server-to-server callers send no Origin — allow those.
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProduction) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    credentials: false,
    maxAge: 86400,
  });

  if (isProduction && corsOrigins.length === 0) {
    logger.warn(
      'CORS_ORIGINS is empty in production — all browser origins will be rejected. Set it to your dashboard/ops/website URLs.',
    );
  }

  // Swagger documents every route, DTO shape and error code. Serving it
  // unauthenticated in production hands an attacker a complete API map, so it
  // is opt-in and off by default.
  if (!isProduction || config.get('ENABLE_API_DOCS') === true) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Court Plus API')
      .setDescription('REST API Reference for Court Plus')
      .setVersion('1.0')
      .addBearerAuth({
        description: `Please enter token in following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      })
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/reference/api', app, documentFactory, {
      jsonDocumentUrl: '/api-json',
    });
    logger.log('API docs enabled at /reference/api');
  }

  // Without this, SIGTERM kills the process immediately: in-flight HTTP
  // requests are dropped mid-write and BullMQ workers abandon running jobs.
  // Every deploy replaces the container, so this fires on every deploy.
  app.enableShutdownHooks();
  // Belt and braces for the graceful shutdown above: if anything keeps the
  // process alive past this window (a stuck connection, a hung hook), exit
  // anyway so the orchestrator/watcher can start the replacement. The timer
  // is unref'd so it never keeps the process alive itself.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      setTimeout(() => {
        console.error(`Shutdown did not finish within 15s of ${signal}; exiting.`);
        process.exit(1);
      }, 15_000).unref();
    });
  }

  // A container that keeps serving after an unhandled rejection is worse than
  // one that restarts: it holds a half-broken state the orchestrator can't see.
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled promise rejection: ${reason}`, (reason as Error)?.stack);
  });
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`, error.stack);
    process.exit(1);
  });

  await app.listen(config.get('port') || 3000);
  logger.log(`Court+ API listening on port ${config.get('port') || 3000} (${config.get('env')})`);
}
bootstrap();
