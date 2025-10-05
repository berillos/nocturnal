import 'dotenv/config';
import { fetch } from '$lib/server/runner';

Bun.serve({
	port: 8341,
	fetch
});

console.info('Runner started on http://localhost:8341');
