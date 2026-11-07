import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

/* TypeORM CLI entry: runs outside Nest via ts-node, so it loads .env itself */
if (existsSync('.env')) process.loadEnvFile();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  namingStrategy: new SnakeNamingStrategy(),
  logging:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  maxQueryExecutionTime: 2000,
});
