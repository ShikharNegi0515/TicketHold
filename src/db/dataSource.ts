import 'reflect-metadata';
import 'pg'; // Force Vercel bundler to include pg (TypeORM loads it dynamically)
import { DataSource } from 'typeorm';
import { Event } from './entities/Event';
import { Tier } from './entities/Tier';
import { Hold } from './entities/Hold';
import { Order } from './entities/Order';
import { WebhookEvent } from './entities/WebhookEvent';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'tickethold',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tickethold',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: true, // For development only!
  logging: false,
  entities: [Event, Tier, Hold, Order, WebhookEvent],
  subscribers: [],
  migrations: [],
});

let isInitialized = false;

export const initializeDB = async () => {
  if (isInitialized) return AppDataSource;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  isInitialized = true;
  return AppDataSource;
};
