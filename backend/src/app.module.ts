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
import { UserContextMiddleware } from './auth/user-context.middleware';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { requestIdMiddleware } from './common/request-id.middleware';
import { SnakeNamingStrategy } from './database/snake-naming.strategy';
import { type EnvironmentVariables, validate } from './config/env.validation';
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
  ],
  providers: [{ provide: APP_FILTER, useClass: DatabaseExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware).forRoutes('{*path}');

    /* user first, then vendor: unauthenticated requests never reach the vendor check */
    consumer
      .apply(UserContextMiddleware, VendorContextMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST },
      )
      .forRoutes('{*path}');
  }
}
