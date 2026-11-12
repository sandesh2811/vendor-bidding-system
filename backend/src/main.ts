import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ContextLogger } from './common/context-logger';
import { AppModule } from './app.module';
import {
  ACCESS_TOKEN_COOKIE,
  API_DEFAULT_VERSION,
  API_PREFIX,
  SWAGGER_PATH,
} from './common/constants';
import { apiRateLimit, loginRateLimit } from './common/rate-limit';
import { type EnvironmentVariables, NodeEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const isProduction =
    config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;

  app.useLogger(new ContextLogger({ json: isProduction }));
  app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));

  /* same-site CORP: the frontend loads photos with <img> from another port (same site, different origin) */
  const secureHeaders = helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
  /* Swagger UI (non-production only) runs inline scripts that the default CSP blocks */
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path.startsWith(`/${SWAGGER_PATH}`)
      ? docsHeaders(req, res, next)
      : secureHeaders(req, res, next),
  );

  /* registered here, so they run before the auth middleware: unauthenticated floods are limited too */
  app.use(`/${API_PREFIX}`, apiRateLimit());
  app.use(
    `/${API_PREFIX}/v${API_DEFAULT_VERSION}/auth/login`,
    loginRateLimit(),
  );

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
