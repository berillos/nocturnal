import { z } from 'zod';
import { base } from '../orpc';
import { Poseidon, UInt32 } from 'o1js';
import * as Ox from 'ox';

export const wallet = {
	buildPayload: base
		.input(z.object({ nonce: z.number(), expirySlot: z.number() }))
		.handler(async ({ input }) => {
			const nonce = UInt32.from(input.nonce);
			const expirySlot = UInt32.from(input.expirySlot);
			const opHash = Poseidon.hash([...nonce.toFields(), ...expirySlot.toFields()]).toBigInt();
			return Ox.Hex.fromNumber(opHash);
		})
};
