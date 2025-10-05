import { os } from '@orpc/server';
import { Job, type Queue, type Worker } from 'bullmq';
import { z } from 'zod';
import type { Database } from '../db';
import { schema } from '../db/schema';
import { eq } from 'drizzle-orm';

const base = os.$context<{
	db: Database;
	queue: Queue;
	worker: Worker;
	env: Record<string, string>;
}>();

export const router = {
	wallet: {
		deploy: base
			.input(z.object({ publicKey: z.string(), passkeyId: z.string() }))
			.handler(async function* ({ context, input }) {
				console.log('>>>START');
				const [newWallet] = await context.db
					.insert(schema.wallet)
					.values({
						ownerPasskeyId: input.passkeyId,
						chainId: 'devnet',
						state: 'initializing'
					})
					.returning()
					.catch((error) => {
						console.error('Error creating wallet:', error);
						throw error;
					});
				console.log('>>>NW', newWallet);
				const initializedJob = await context.queue.add('deploy', {
					publicKey: input.publicKey,
					env: context.env
				});
				yield { state: 'active' };
				while (true) {
					const state = await initializedJob.getState();
					if (state === 'completed') {
						const completedJob = await Job.fromId(context.queue, initializedJob.id!);
						if (!completedJob) {
							return;
						}
						const address: string = completedJob.returnvalue;
						await context.db
							.update(schema.wallet)
							.set({ address, state: 'deployed' })
							.where(eq(schema.wallet.id, newWallet.id));
						yield { state: 'completed' };
						return;
					}
					if (state === 'failed') {
						yield { state: 'failed' };
						return;
					}
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			})
	}
};
