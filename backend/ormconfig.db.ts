import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
const dataSource = new DataSource({
  type: 'postgres',
  database: process.env.DATABASE_NAME,
  migrationsTableName: '_migrations',

  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  password: process.env.DATABASE_PASSWORD,
  username: process.env.DATABASE_USERNAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  migrationsRun: false,
});

export default dataSource;
