import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', {
		mode: 'timestamp_ms'
	}),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', {
		mode: 'timestamp_ms'
	}),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const passkey = sqliteTable('passkey', {
	id: text('id').primaryKey(),
	name: text('name'),
	publicKey: text('public_key').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	credentialID: text('credential_id').notNull(),
	counter: integer('counter').notNull(),
	deviceType: text('device_type').notNull(),
	backedUp: integer('backed_up', { mode: 'boolean' }).notNull(),
	transports: text('transports'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }),
	aaguid: text('aaguid')
});

export const wallet = sqliteTable('wallet', {
	id: text('id').primaryKey(), // uuid
	address: text('address').notNull().unique(), // Mina zkApp public key
	chainId: text('chain_id').notNull(), // network binding
	ownerPasskeyId: text('owner_passkey_id')
		.notNull()
		.references(() => passkey.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const userOperation = sqliteTable('user_operation', {
	id: text('id').primaryKey(), // uuid
	walletId: text('wallet_id')
		.notNull()
		.references(() => wallet.id, { onDelete: 'cascade' }),
	nonce: integer('nonce').notNull(),
	expirySlot: integer('expiry_slot').notNull(),
	childAccountUpdates: text('child_account_updates', { mode: 'json' }).notNull(),
	challenge: text('challenge').notNull(),
	payload: text('payload').notNull(),
	signature: text('signature').notNull(),
	status: text('status').default('pending').notNull(), // pending | verified | bundled | failed
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const transaction = sqliteTable('transaction', {
	id: text('id').primaryKey(), // uuid
	userOperationId: text('user_operation_id').references(() => userOperation.id, {
		onDelete: 'set null'
	}),
	txHash: text('tx_hash').notNull().unique(),
	status: text('status').default('broadcast').notNull(), // broadcast | confirmed | failed
	feePayer: text('fee_payer').notNull(),
	includedAt: integer('included_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.$onUpdate(() => new Date())
		.notNull()
});

/* ========== Relations ========== */

export const passkeyRelations = relations(passkey, ({ one, many }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id]
	}),
	wallets: many(wallet)
}));

export const walletRelations = relations(wallet, ({ one, many }) => ({
	user: one(user, {
		fields: [wallet.userId],
		references: [user.id]
	}),
	ownerPasskey: one(passkey, {
		fields: [wallet.ownerPasskeyId],
		references: [passkey.id]
	}),
	operations: many(userOperation)
}));

export const userOperationRelations = relations(userOperation, ({ one, many }) => ({
	wallet: one(wallet, {
		fields: [userOperation.walletId],
		references: [wallet.id]
	}),
	transactions: many(transaction)
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
	userOperation: one(userOperation, {
		fields: [transaction.userOperationId],
		references: [userOperation.id]
	})
}));

/* ========== Zod Schemas ========== */

export const WalletSelectSchema = createSelectSchema(wallet);
export const WalletInsertSchema = createInsertSchema(wallet);
export const UserOperationSelectSchema = createSelectSchema(userOperation);
export const UserOperationInsertSchema = createInsertSchema(userOperation);
export const TransactionSelectSchema = createSelectSchema(transaction);
export const TransactionInsertSchema = createInsertSchema(transaction);

/* ========== Export bundle ========== */

export const schema = {
	user,
	session,
	account,
	verification,
	passkey,
	wallet,
	userOperation,
	transaction
};
