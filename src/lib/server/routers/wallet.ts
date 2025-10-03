import { base } from '$lib/server/orpc';
import { AccountUpdate, PublicKey } from 'o1js';
import z from 'zod';

const Base58 = z.string();

const BuildSendParams = z.object({
	walletAddress: Base58,
	to: Base58,
	amount: z.string()
});

const BuildStakeParams = z.object({
	walletAddress: Base58,
	validator: Base58
});

export const wallet = {
	accountUpdate: {
		buildSend: base.input(BuildSendParams).handler(({ input }) => {
			try {
				const walletAddress = PublicKey.fromBase58(input.walletAddress);
				const to = PublicKey.fromBase58(input.to);
				const senderAccountUpdate = AccountUpdate.create(walletAddress);
				senderAccountUpdate.send({ to, amount: BigInt(input.amount) });
				return senderAccountUpdate.extractTree();
			} catch (error) {
				console.error(error);
				throw error;
			}
		}),
		buildStake: base.input(BuildStakeParams).handler(({ input }) => {
			const walletAddress = PublicKey.fromBase58(input.walletAddress);
			const validator = PublicKey.fromBase58(input.validator);
			const stakeAccountUpdate = AccountUpdate.create(walletAddress);
			stakeAccountUpdate.account.delegate.set(validator);
			return stakeAccountUpdate.extractTree();
		})
	}
};
