import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  /* required, no default: a deploy that forgets it must fail, not run with dev settings (non-secure cookie, Swagger) */
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsUrl({ protocols: ['postgres', 'postgresql'], require_tld: false })
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS: number = 60 * 60 * 24 * 7;

  @IsUrl({ require_tld: false })
  FRONTEND_ORIGIN: string;

  /* proxy hops in front of the API (express `trust proxy`); 0 = direct, so req.ip, and the rate limit, is the client */
  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY: number = 0;

  /* root for uploaded files (quotation photos); relative paths resolve from the process cwd */
  @IsString()
  @MinLength(1)
  UPLOAD_DIR: string = 'uploads';
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors.map(
      (e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
    );
    throw new Error(
      `Invalid environment variables:\n  ${details.join('\n  ')}`,
    );
  }
  return env;
}
