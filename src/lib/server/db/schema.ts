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
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	address: text('address').unique(),
	chainId: text('chain_id', { enum: ['devnet', 'mainnet'] }).notNull(), // network binding
	state: text('state', { enum: ['initializing', 'deployed'] })
		.notNull()
		.default('initializing'),
	ownerPasskeyId: text('owner_passkey_id')
		.notNull()
		.references(() => passkey.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(strftime('%s','now'))`)
		.$onUpdate(() => new Date())
		.notNull()
});

/* ========== Relations ========== */

export const userRelations = relations(user, ({ many }) => ({
	passkeys: many(passkey)
}));

export const passkeyRelations = relations(passkey, ({ one, many }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id]
	}),
	wallets: many(wallet)
}));

export const walletRelations = relations(wallet, ({ one }) => ({
	passkey: one(passkey, {
		fields: [wallet.ownerPasskeyId],
		references: [passkey.id]
	})
}));

/* ========== Zod Schemas ========== */

export const WalletSelectSchema = createSelectSchema(wallet);
export const WalletInsertSchema = createInsertSchema(wallet);

/* ========== Export bundle ========== */

export const schema = {
	user,
	session,
	account,
	verification,
	passkey,
	wallet,
	userRelations,
	passkeyRelations,
	walletRelations
};
