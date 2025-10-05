import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { match } from 'ts-pattern';
import * as Ox from 'ox';
import { Secp256r1, SmartWallet } from '$lib/contracts/smart-wallet';
import { Mina, Poseidon, PrivateKey, type NetworkId } from 'o1js';

const FEE = 1e8;
const MINA_GQL_DEVNET_URL = 'https://api.minascan.io/node/devnet/v1/graphql';
const MINA_GQL_MAINNET_URK = 'https://api.minascan.io/node/mainnet/v1/graphql';

const connection = new IORedis({ maxRetriesPerRequest: null, port: 6379 });

const QUEUE_NAME = 'contracts';

export const queue = new Queue(QUEUE_NAME, { connection });

export const worker = new Worker(
	QUEUE_NAME,
	async (job) => {
		return match(job)
			.with({ name: 'deploy' }, async ({ data }) => {
				const zkAppKey = PrivateKey.randomKeypair();
				const feePayerPrivateKey = PrivateKey.fromBase58(data.env.PRIVATE_FEEPAYER_PRIVATE_KEY);
				const feePayerPublicKey = feePayerPrivateKey.toPublicKey();
				const Network = Mina.Network({
					networkId: 'devnet' as NetworkId,
					mina: MINA_GQL_DEVNET_URL
				});
				Mina.setActiveInstance(Network);
				const ownerPublicKey = Ox.PublicKey.fromHex(data.publicKey as Ox.Hex.Hex);
				const owner = Secp256r1.from({
					x: ownerPublicKey.x,
					y: ownerPublicKey.y
				});
				const ownerHash = Poseidon.hash(Secp256r1.provable.toFields(owner));
				await SmartWallet.compile();
				console.log('>>>COMPILED');
				const smartWallet = new SmartWallet(zkAppKey.publicKey);
				const deployTx = await Mina.transaction(
					{ sender: feePayerPublicKey, fee: FEE },
					async () => {
						await smartWallet.deploy();
					}
				);
				await deployTx.prove();
				await deployTx.sign([feePayerPrivateKey, zkAppKey.privateKey]).send();
				const initTx = await Mina.transaction({ sender: feePayerPublicKey, fee: FEE }, async () => {
					await smartWallet.initialize(ownerHash);
				});
				await initTx.prove();
				const submittedInitTx = await initTx.sign([feePayerPrivateKey]).send();
				await submittedInitTx.wait();
				return zkAppKey.publicKey.toBase58();
			})
			.otherwise(() => {
				return 'Unknown job';
			});
	},
	{ connection, maxStalledCount: 5, stalledInterval: 180000 }
);
