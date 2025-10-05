import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

if (!process.env.PRIVATE_DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = createClient({ url: process.env.PRIVATE_DATABASE_URL });

export const db = drizzle(client, { schema });
export type Database = typeof db;
