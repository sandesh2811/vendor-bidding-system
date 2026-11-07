import { type INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import {
  type EnvironmentVariables,
  NodeEnv,
} from '../../config/env.validation';
import { seedAdmin } from './admin.seed';
import { seedVendors } from './vendors.seed';

const SEEDERS: [string, (app: INestApplicationContext) => Promise<void>][] = [
  ['admin', seedAdmin],
  ['vendors', seedVendors],
];

const logger = new Logger('Seed');

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const env = app
      .get<ConfigService<EnvironmentVariables, true>>(ConfigService)
      .get('NODE_ENV', { infer: true });

    if (env === NodeEnv.Production)
      throw new Error('Refusing to seed: NODE_ENV is production');

    for (const [name, run] of SEEDERS) {
      await run(app);

      logger.log({
        method: 'seed',
        message: 'Seeder finished',
        seeder: name,
        env,
      });
    }
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  logger.error(
    { method: 'seed', message: 'Seeding failed' },
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
