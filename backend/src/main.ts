import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './modules/shared/exception-filter';
import { initializeTransactionalContext } from 'typeorm-transactional';
async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  const config = new DocumentBuilder()
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
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/reference/api', app, documentFactory, {
    jsonDocumentUrl: '/api-json',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
