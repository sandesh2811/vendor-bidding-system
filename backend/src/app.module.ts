import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BidsModule } from './bids/bids.module';
import { UserContextMiddleware } from './auth/user-context.middleware';
import { API_DEFAULT_VERSION } from './common/constants';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { requestIdMiddleware } from './common/request-id.middleware';
import { SnakeNamingStrategy } from './database/snake-naming.strategy';
import { type EnvironmentVariables, validate } from './config/env.validation';
import { QuotationsModule } from './quotations/quotations.module';
import { VendorContextMiddleware } from './vendors/vendor-context.middleware';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', { infer: true }),
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
    AuthModule,
    VendorsModule,
    QuotationsModule,
    BidsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: DatabaseExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware).forRoutes('{*path}');

    /* user first, then vendor: unauthenticated requests never reach the vendor check.
       Excludes must carry the URI version, or they never match /api/v1/... and login itself gets a 401 */
    consumer
      .apply(UserContextMiddleware, VendorContextMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
          version: API_DEFAULT_VERSION,
        },
        {
          path: 'auth/logout',
          method: RequestMethod.POST,
          version: API_DEFAULT_VERSION,
        },
      )
      .forRoutes('{*path}');
  }
}
