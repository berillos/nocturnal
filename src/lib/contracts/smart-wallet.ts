import {
	SmartContract,
	state,
	State,
	method,
	Field,
	Struct,
	Crypto,
	createForeignCurve,
	createEcdsa,
	Poseidon,
	UInt32,
	Permissions,
	type DeployArgs,
	PublicKey,
	AccountUpdate,
	UInt64
} from 'o1js';

export class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) {}
export class EcdsaP256 extends createEcdsa(Secp256r1) {}

/* ------------ Typed op ------------ */
export class Operation extends Struct({
	nonce: UInt32, // wallet-level replay protection
	expirySlot: UInt32 // TTL (compare against current slot)
}) {}

/* ------------ Events ------------ */
export class MinaSentEvent extends Struct({
	amount: UInt64,
	receiver: PublicKey,
	expirySlot: UInt32,
	nonce: UInt32
}) {}
export class UpdateApprovedEvent extends Struct({
	nonce: UInt32,
	expirySlot: UInt32
}) {}
export class OwnerRotatedEvent extends Struct({
	oldOwnerHash: Field,
	newOwnerHash: Field,
	nonce: UInt32
}) {}
export class ValidatorChangedEvent extends Struct({
	oldValidator: PublicKey,
	newValidator: PublicKey
}) {}

/* ============================================================
 * SmartWallet — state-packed AA wallet
 *  - Stores only hash(owner) instead of (x,y)
 *  - Verifies P-256 directly and approves child AU
 * ============================================================ */
export class SmartWallet extends SmartContract {
	// hash(ownerP256) : 1 Field
	@state(Field) ownerCommit = State<Field>();

	events = {
		updateApproved: UpdateApprovedEvent,
		ownerRotated: OwnerRotatedEvent,
		validatorChanged: ValidatorChangedEvent,
		minaSent: MinaSentEvent
	} as const;

	private hashOwner(owner: Secp256r1): Field {
		return Poseidon.hash(Secp256r1.provable.toFields(owner));
	}

	private assertExpiry(expirySlot: UInt32) {
		const now = this.network.globalSlotSinceGenesis;
		now.requireBetween(UInt32.from(0), expirySlot);
	}

	private assertOwner(owner: Secp256r1) {
		const ownerCommit = this.ownerCommit.get();
		this.ownerCommit.requireEquals(ownerCommit);
		const providedOwnerCommit = this.hashOwner(owner);
		providedOwnerCommit.assertEquals(ownerCommit);
		return ownerCommit;
	}

	@method async initialize(owner: Field) {
		this.ownerCommit.set(owner);
	}

	async deploy(args?: DeployArgs) {
		super.deploy(args);
		this.account.permissions.set({
			...Permissions.default(),
			access: Permissions.proof(),
			send: Permissions.proof(),
			setDelegate: Permissions.proof(),
			incrementNonce: Permissions.proof()
		});
	}

	@method async validateAndSend(
		op: Operation,
		owner: Secp256r1,
		// @ts-expect-error needs to be done this way, won't work with AlmostForeignField
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		receiver: PublicKey,
		amount: UInt64
	) {
		this.assertOwner(owner);
		this.account.nonce.requireEquals(op.nonce);
		this.assertExpiry(op.expirySlot);
		signature.verifySignedHash(payload, owner).assertTrue();
		this.send({ to: receiver, amount });
		this.emitEvent(
			'minaSent',
			new MinaSentEvent({ amount, receiver, nonce: op.nonce, expirySlot: op.expirySlot })
		);
	}

	@method async validateAndChangeValidator(
		op: Operation,
		owner: Secp256r1,
		// @ts-expect-error needs to be done this way, won't work with AlmostForeignField
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		validator: PublicKey
	) {
		this.assertOwner(owner);
		this.account.nonce.requireEquals(op.nonce);
		this.assertExpiry(op.expirySlot);
		signature.verifySignedHash(payload, owner).assertTrue();
		this.account.delegate.requireEquals(this.account.delegate.get());
		const oldValidator = this.account.delegate.get();
		this.account.delegate.set(validator);
		this.emitEvent(
			'validatorChanged',
			new ValidatorChangedEvent({
				oldValidator: oldValidator,
				newValidator: validator
			})
		);
	}

	@method async validateAndApproveUpdate(
		op: Operation,
		owner: Secp256r1,
		// @ts-expect-error needs to be done this way, won't work with AlmostForeignField
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		child: AccountUpdate
	) {
		this.assertOwner(owner);
		this.account.nonce.requireEquals(op.nonce);
		this.assertExpiry(op.expirySlot);
		signature.verifySignedHash(payload, owner).assertTrue();
		this.approve(child);
		this.emitEvent(
			'updateApproved',
			new UpdateApprovedEvent({ nonce: op.nonce, expirySlot: op.expirySlot })
		);
	}

	@method async validateAndRotateOwner(
		op: Operation,
		owner: Secp256r1,
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		newOwnerHash: Field
	) {
		const oldHash = this.assertOwner(owner);
		this.account.nonce.requireEquals(op.nonce);
		this.assertExpiry(op.expirySlot);
		signature.verifySignedHash(payload, owner).assertTrue();
		this.ownerCommit.set(newOwnerHash);
		this.emitEvent(
			'ownerRotated',
			new OwnerRotatedEvent({
				oldOwnerHash: oldHash,
				newOwnerHash: newOwnerHash,
				nonce: op.nonce
			})
		);
	}
}
