import { beforeAll, describe, expect, it } from 'bun:test';
import { Mina, Poseidon, UInt32, UInt64 } from 'o1js';
import {
	Authentication,
	EcdsaP256,
	Secp256r1,
	SendOperation,
	SmartWallet,
	StakeOperation
} from './smart-wallet';
import * as Ox from 'ox';

// Needs to be on since the smart wallet depends on proofs.
const PROOFS_ENABLED = true;
const FEE = 1e8;
const PUBLIC_KEY =
	'0x04a51b8817f82793a5a074d35bcb35df81e5922bde7d55b7f86a1aea44070c6572b968500446d30c1de11e634b26c4f266ea88046d7721803499d87cf00fc6abb2';
const PAYLOAD =
	'0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000d34a612126d5355031c831eff1ea01814ec72629f80bbfcff492cd00ff6922de';
const SIGNATURE =
	'0x152a713869251088a965f7f10862311adca771f0016ff03a7ea56122c31fe37a29b17a72a995260425a1eda3f1a0d59a2181805503bf92f2f304e9016243b4fd';

describe('Smart Wallet', () => {
	const ownerPublicKey = Ox.PublicKey.fromHex(PUBLIC_KEY);
	const owner = Secp256r1.from({
		x: ownerPublicKey.x,
		y: ownerPublicKey.y
	});
	const ownerHash = Poseidon.hash(Secp256r1.provable.toFields(owner));
	let feePayer: Mina.TestPublicKey;
	let zkAppKey: Mina.TestPublicKey;
	let recipient: Mina.TestPublicKey;
	let validator: Mina.TestPublicKey;
	let smartWallet: SmartWallet;

	beforeAll(
		async () => {
			const localChain = await Mina.LocalBlockchain({
				proofsEnabled: PROOFS_ENABLED,
				enforceTransactionLimits: false
			});
			Mina.setActiveInstance(localChain);
			feePayer = localChain.testAccounts[0];
			zkAppKey = localChain.testAccounts[1];
			recipient = localChain.testAccounts[2];
			validator = localChain.testAccounts[3];
			await SmartWallet.compile();
			smartWallet = new SmartWallet(zkAppKey);
		},
		{ timeout: 180000 }
	);

	it(
		'deploys the smart wallet to local network',
		async () => {
			const deployTx = await Mina.transaction({ sender: feePayer, fee: FEE }, async () => {
				await smartWallet.deploy();
			});
			await deployTx.prove();
			await deployTx.sign([feePayer.key, zkAppKey.key]).send();

			const initTx = await Mina.transaction({ sender: feePayer, fee: FEE }, async () => {
				await smartWallet.initialize(ownerHash);
			});
			await initTx.prove();
			await initTx.sign([feePayer.key]).send();
		},
		{ timeout: 180000 }
	);

	it(
		'sends 1 Mina from wallet to recipient',
		async () => {
			const amount = UInt64.from(1_000_000_000n);
			const now = Mina.getNetworkState().globalSlotSinceGenesis;
			const operation = new SendOperation({
				receiver: recipient,
				amount,
				nonce: Mina.getAccount(zkAppKey).nonce,
				expirySlot: now.add(UInt32.from(20))
			});
			const msgHashHex = Ox.Hash.sha256(PAYLOAD);
			const payload = Secp256r1.Scalar.from(Ox.Bytes.toBigInt(Ox.Bytes.fromHex(msgHashHex)));
			const signature = EcdsaP256.from(Ox.Signature.fromHex(SIGNATURE));
			const authentication = new Authentication({
				payload,
				signature,
				publicKey: owner
			});
			const paymentTx = await Mina.transaction({ sender: feePayer, fee: FEE }, async () => {
				await smartWallet.validateAndSend(authentication, operation);
			});
			await paymentTx.prove();
			const txState = await paymentTx.sign([feePayer.key]).send();
			await txState.wait();
			const recipientAccount = Mina.getAccount(recipient);
			expect(recipientAccount.balance.toBigInt() / 1_000_000_000n).toEqual(1001n);
		},
		{ timeout: 180000 }
	);

	it(
		'stakes Mina to validator',
		async () => {
			const now = Mina.getNetworkState().globalSlotSinceGenesis;
			const operation = new StakeOperation({
				validator,
				nonce: Mina.getAccount(zkAppKey).nonce,
				expirySlot: now.add(UInt32.from(21))
			});
			const payload = Secp256r1.Scalar.from(
				Ox.Bytes.toBigInt(Ox.Bytes.fromHex(Ox.Hash.sha256(PAYLOAD)))
			);
			const signature = EcdsaP256.from(Ox.Signature.fromHex(SIGNATURE));
			const authentication = new Authentication({
				payload,
				signature,
				publicKey: owner
			});
			const stakeTx = await Mina.transaction({ sender: feePayer, fee: FEE }, async () => {
				await smartWallet.validateAndChangeValidator(authentication, operation);
			});
			await stakeTx.prove();
			await stakeTx.sign([feePayer.key]).send();
			const currentValidator = Mina.getAccount(zkAppKey).delegate;
			expect(currentValidator?.toBase58()).toEqual(validator.toBase58());
		},
		{ timeout: 180000 }
	);
});
