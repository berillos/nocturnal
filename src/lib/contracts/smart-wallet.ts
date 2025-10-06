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

const BaseOperation = {
	nonce: UInt32,
	expirySlot: UInt32
};

export class SendOperation extends Struct({
	...BaseOperation,
	amount: UInt64,
	receiver: PublicKey
}) {}

export class StakeOperation extends Struct({
	...BaseOperation,
	validator: PublicKey
}) {}

export class ApproveUpdateOperation extends Struct({
	...BaseOperation,
	update: AccountUpdate
}) {}

export class RotateOwnerOperation extends Struct({
	...BaseOperation,
	newOwnerCommit: Field
}) {}

export class Authentication extends Struct({
	payload: Secp256r1.Scalar,
	signature: EcdsaP256,
	publicKey: Secp256r1
}) {
	verify() {
		this.signature.verifySignedHash(this.payload, this.publicKey).assertTrue();
	}
}

/* ------------ Events ------------ */
export class MinaSentEvent extends Struct({
	operation: SendOperation
}) {}

export class UpdateApprovedEvent extends Struct({
	operation: BaseOperation
}) {}

export class OwnerRotatedEvent extends Struct({
	operation: RotateOwnerOperation,
	prevOwnerCommit: Field
}) {}

export class ValidatorChangedEvent extends Struct({
	operation: StakeOperation,
	prevValidator: PublicKey
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

	@method async validateAndSend(authentication: Authentication, operation: SendOperation) {
		this.assertOwner(authentication.publicKey);
		this.account.nonce.requireEquals(operation.nonce);
		this.assertExpiry(operation.expirySlot);
		authentication.verify();
		this.send({ to: operation.receiver, amount: operation.amount });
		this.emitEvent('minaSent', new MinaSentEvent({ operation }));
	}

	@method async validateAndChangeValidator(
		authentication: Authentication,
		operation: StakeOperation
	) {
		this.assertOwner(authentication.publicKey);
		this.account.nonce.requireEquals(operation.nonce);
		this.assertExpiry(operation.expirySlot);
		authentication.verify();
		this.account.delegate.requireEquals(this.account.delegate.get());
		const prevValidator = this.account.delegate.get();
		this.account.delegate.set(operation.validator);
		this.emitEvent(
			'validatorChanged',
			new ValidatorChangedEvent({
				operation,
				prevValidator
			})
		);
	}

	@method async validateAndApproveUpdate(
		authentication: Authentication,
		operation: ApproveUpdateOperation
	) {
		this.assertOwner(authentication.publicKey);
		this.account.nonce.requireEquals(operation.nonce);
		this.assertExpiry(operation.expirySlot);
		authentication.verify();
		this.approve(operation.update);
		this.emitEvent('updateApproved', new UpdateApprovedEvent({ operation }));
	}

	@method async validateAndRotateOwner(
		authentication: Authentication,
		operation: RotateOwnerOperation
	) {
		const prevOwnerCommit = this.assertOwner(authentication.publicKey);
		this.account.nonce.requireEquals(operation.nonce);
		this.assertExpiry(operation.expirySlot);
		authentication.verify();
		this.ownerCommit.set(operation.newOwnerCommit);
		this.emitEvent(
			'ownerRotated',
			new OwnerRotatedEvent({
				operation,
				prevOwnerCommit
			})
		);
	}
}
