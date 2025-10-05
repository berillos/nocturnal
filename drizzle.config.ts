import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.PRIVATE_DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.PRIVATE_DATABASE_URL },
	verbose: true,
	strict: true
});
