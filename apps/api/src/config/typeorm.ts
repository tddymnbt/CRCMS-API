import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

dotenvConfig({ path: path.join(__dirname, '../../.env') });

console.log('Database Configuration:');
console.log(`Host: ${process.env.DATABASE_HOST}`);
console.log(`Port: ${process.env.DATABASE_PORT}`);
console.log(`Username: ${process.env.DATABASE_USERNAME}`);
console.log(`Password: ${process.env.DATABASE_PASSWORD}`);
console.log(`Database: ${process.env.DATABASE_NAME}`);

const config = {
  type: 'postgres',
  host: `${process.env.DATABASE_HOST}`,
  port: `${process.env.DATABASE_PORT}`,
  username: `${process.env.DATABASE_USERNAME}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}`,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false,
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
