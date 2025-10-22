import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Endpoint } from './src/modules/endpoints/endpoint.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Endpoint],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  logging: true,
});

export default AppDataSource;