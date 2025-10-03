import {
	SmartContract,
	state,
	State,
	method,
	UInt64,
	Field,
	Struct,
	Crypto,
	createForeignCurve,
	createEcdsa,
	Poseidon,
	UInt32,
	Permissions,
	type DeployArgs,
	PublicKey
} from 'o1js';

export class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) {}
export class EcdsaP256 extends createEcdsa(Secp256r1) {}

/* ------------ Typed op ------------ */
export class Operation extends Struct({
	nonce: UInt32, // wallet-level replay protection
	expirySlot: UInt32 // TTL (compare against current slot)
}) {}

/* ------------ Events ------------ */
export class ApprovedEvent extends Struct({
	nonce: UInt32,
	expirySlot: UInt32
}) {}
export class OwnerRotatedEvent extends Struct({
	oldOwnerHash: Field,
	newOwnerHash: Field,
	nonce: UInt32
}) {}
export class ValidatorChangedEvent extends Struct({
	oldValidatorHash: PublicKey,
	newValidatorHash: PublicKey
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
		approved: ApprovedEvent,
		ownerRotated: OwnerRotatedEvent,
		validatorChanged: ValidatorChangedEvent
	} as const;

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

	// TODO: Check if we really can't go with accepting account updates.
	// @method async validateAndApprove(
	// 	op: Operation,
	// 	owner: Secp256r1,
	// 	payload: Secp256r1.Scalar,
	// 	signature: EcdsaP256,
	// 	child: AccountUpdate
	// ) {
	// 	// Load state
	// 	const ownerC = this.ownerCommit.get();
	// 	this.ownerCommit.requireEquals(ownerC);
	// 	this.account.nonce.requireEquals(op.nonce);
	// 	const now = this.network.globalSlotSinceGenesis;
	// 	now.requireBetween(UInt32.from(0), op.expirySlot);
	// 	// Owner must match commitment; then verify signature against provided owner
	// 	const _ownerCommit = Poseidon.hash(Secp256r1.provable.toFields(owner));
	// 	_ownerCommit.assertEquals(ownerC);
	// 	const ok: Bool = signature.verifySignedHash(payload, owner);
	// 	ok.assertTrue();
	// 	this.approve(child);
	// 	this.emitEvent('approved', new ApprovedEvent({ nonce: op.nonce, expirySlot: op.expirySlot }));
	// }

	@method async validateAndApprove(
		op: Operation,
		owner: Secp256r1,
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		to: PublicKey,
		amount: UInt64
	) {
		// Bind current on-chain state
		const ownerC = this.ownerCommit.get();
		this.ownerCommit.requireEquals(ownerC);

		this.account.nonce.requireEquals(op.nonce);
		const now = this.network.globalSlotSinceGenesis;
		now.requireBetween(UInt32.from(0), op.expirySlot);

		// Owner commit check + WebAuthn P-256 verify
		const _ownerCommit = Poseidon.hash(Secp256r1.provable.toFields(owner));
		_ownerCommit.assertEquals(ownerC);
		signature.verifySignedHash(payload, owner).assertTrue();

		// Move funds directly from the zkApp (no child AU)
		this.send({ to, amount });
		this.emitEvent('approved', new ApprovedEvent({ nonce: op.nonce, expirySlot: op.expirySlot }));
	}

	/**
	 * rotateOwner — rotate P-256 owner using current owner's signature.
	 */
	@method async rotateOwner(
		op: Operation,
		currentOwner: Secp256r1,
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		newOwnerHash: Field
	) {
		const ownerC = this.ownerCommit.get();
		this.ownerCommit.requireEquals(ownerC);
		this.account.nonce.requireEquals(op.nonce);
		const now = this.network.globalSlotSinceGenesis;
		now.requireBetween(UInt32.from(0), op.expirySlot);
		// Current owner must match commitment; signature must verify with current owner
		const _ownerCommit = Poseidon.hash(Secp256r1.provable.toFields(currentOwner));
		_ownerCommit.assertEquals(ownerC);
		signature.verifySignedHash(payload, currentOwner).assertTrue();
		const oldHash = ownerC;
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

	@method async changeValidator(
		op: Operation,
		currentOwner: Secp256r1,
		payload: Secp256r1.Scalar,
		signature: EcdsaP256,
		validator: PublicKey
	) {
		const ownerC = this.ownerCommit.get();
		this.ownerCommit.requireEquals(ownerC);
		this.account.nonce.requireEquals(op.nonce);
		const now = this.network.globalSlotSinceGenesis;
		now.requireBetween(UInt32.from(0), op.expirySlot);
		// Current owner must match commitment; signature must verify with current owner
		const _ownerCommit = Poseidon.hash(Secp256r1.provable.toFields(currentOwner));
		_ownerCommit.assertEquals(ownerC);
		signature.verifySignedHash(payload, currentOwner).assertTrue();
		this.account.delegate.requireEquals(this.account.delegate.get());
		const oldValidator = this.account.delegate.get();
		this.account.delegate.set(validator);
		this.emitEvent(
			'validatorChanged',
			new ValidatorChangedEvent({
				oldValidatorHash: oldValidator,
				newValidatorHash: validator
			})
		);
	}
}
