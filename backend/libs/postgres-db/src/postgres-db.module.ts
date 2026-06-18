import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface PostgresDbOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

export const createPostgresTypeOrmOptions = (
  options: PostgresDbOptions = {},
): TypeOrmModuleOptions => {
  const host = options.host ?? process.env.POSTGRES_HOST ?? 'localhost';
  const port =
    options.port ??
    (process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432);
  const username = options.username ?? process.env.POSTGRES_USER ?? 'postgres';
  const password = options.password ?? process.env.POSTGRES_PASSWORD ?? 'postgres';
  const database = options.database ?? process.env.POSTGRES_DB ?? 'postgres';
  const sslFromEnv = process.env.POSTGRES_SSL === 'true';
  const ssl = options.ssl ?? sslFromEnv;

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize: false,
    ssl,
  };
};

@Module({
  imports: [],
})
export class PostgresDbModule {
  static forRoot(options: PostgresDbOptions = {}): DynamicModule {
    return {
      module: PostgresDbModule,
      imports: [TypeOrmModule.forRoot(createPostgresTypeOrmOptions(options))],
      exports: [TypeOrmModule],
    };
  }

  static forRootAsync(options: TypeOrmModuleAsyncOptions): DynamicModule {
    return {
      module: PostgresDbModule,
      imports: [TypeOrmModule.forRootAsync(options)],
      exports: [TypeOrmModule],
    };
  }
}
