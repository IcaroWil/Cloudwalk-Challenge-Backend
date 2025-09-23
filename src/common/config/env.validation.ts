import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv { development='development', test='test', production='production' }

class EnvironmentVariables {
  @IsEnum(NodeEnv) NODE_ENV!: NodeEnv;
  @IsInt() PORT!: number;

  @IsString() @IsOptional() REDIS_HOST?: string;
  @IsInt() @IsOptional() REDIS_PORT?: number;
  @IsString() @IsOptional() REDIS_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const transformed = plainToInstance(EnvironmentVariables, {
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: Number(config.PORT ?? 3000),
    REDIS_HOST: config.REDIS_HOST ?? 'localhost',
    REDIS_PORT: Number(config.REDIS_PORT ?? 6379),
    REDIS_PASSWORD: config.REDIS_PASSWORD ?? undefined,
  }, { enableImplicitConversion: true });

  const errors = validateSync(transformed, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return transformed;
}
