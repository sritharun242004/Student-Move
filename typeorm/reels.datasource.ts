import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const host = process.env.POSTGRES_HOST ?? 'localhost';
const port = process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432;
const username = process.env.POSTGRES_USER ?? 'postgres';
const password = process.env.POSTGRES_PASSWORD ?? 'postgres';
const database = process.env.POSTGRES_DB ?? 'postgres';
const ssl = process.env.POSTGRES_SSL === 'true';
const isTsRuntime = __filename.endsWith('.ts');

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  ssl,
  synchronize: false,
  entities: isTsRuntime
    ? ['apps/reels-service/src/domain/entities/*.entity.ts']
    : ['dist/apps/reels-service/**/*.entity.js'],
  migrations: isTsRuntime
    ? ['apps/reels-service/src/database/migrations/*.ts']
    : ['dist/apps/reels-service/database/migrations/*.js'],
};

export default new DataSource(dataSourceOptions);
