import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ContextLogger } from './common/context-logger';
import { AppModule } from './app.module';
import {
  ACCESS_TOKEN_COOKIE,
  API_DEFAULT_VERSION,
  API_PREFIX,
  SWAGGER_PATH,
} from './common/constants';
import { type EnvironmentVariables, NodeEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const isProduction =
    config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;

  app.useLogger(new ContextLogger({ json: isProduction }));

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
  app.use(cookieParser());
  /* honours @Exclude()/@Expose() on entities, so passwordHash never reaches a response */
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [config.get('FRONTEND_ORIGIN', { infer: true })],
    credentials: true,
  });
  app.enableShutdownHooks();

  if (!isProduction) {
    const doc = new DocumentBuilder()
      .setTitle('Vendor Bidding API')
      .setVersion(API_DEFAULT_VERSION)
      .addCookieAuth(ACCESS_TOKEN_COOKIE)
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      SWAGGER_PATH,
      app,
      SwaggerModule.createDocument(app, doc),
    );
  }

  await app.listen(config.get('PORT', { infer: true }));
}
void bootstrap();
