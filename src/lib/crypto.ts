import { Base64, Bytes, Hash, Hex, Signature } from 'ox';
import { decode as cborDecode, encode as cborEncode } from 'cborg';
import type { SignMetadata } from 'ox/WebAuthnP256';

const n = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');

export function parseAsn1Signature(bytes: Uint8Array) {
	const r_start = bytes[4] === 0 ? 5 : 4;
	const r_end = r_start + 32;
	const s_start = bytes[r_end + 2] === 0 ? r_end + 3 : r_end + 2;

	const r = BigInt(Hex.fromBytes(bytes.slice(r_start, r_end)));
	const s = BigInt(Hex.fromBytes(bytes.slice(s_start)));

	return {
		r,
		s: s > n / 2n ? n - s : s
	};
}

/** COSE(EC2) → { x, y } */
function decodeCoseEc2(coseBytes: Uint8Array) {
	// Keep CBOR maps as Map so integer labels (-2, -3) work
	const m = cborDecode(coseBytes, { useMaps: true }) as Map<number, unknown>;

	// COSE labels: 1=kty(2), 3=alg(-7), -1=crv(1), -2=x, -3=y
	const x = new Uint8Array(m.get(-2) as ArrayBuffer | Uint8Array);
	const y = new Uint8Array(m.get(-3) as ArrayBuffer | Uint8Array);

	if (x.length !== 32 || y.length !== 32)
		throw new Error(`Invalid P-256 COSE key: x=${x.length}, y=${y.length}`);

	return { x, y };
}

/** { x, y } → raw uncompressed EC point (65 bytes) */
function xyToRawUncompressed(x: Uint8Array, y: Uint8Array) {
	const raw = new Uint8Array(65);
	raw[0] = 0x04;
	raw.set(x, 1);
	raw.set(y, 33);
	return raw;
}

/** raw uncompressed (65) → { x, y } */
function rawToXy(raw: Uint8Array) {
	if (raw.length !== 65 || raw[0] !== 0x04)
		throw new Error('Expected uncompressed P-256 point (65 bytes, 0x04 prefix)');
	return {
		x: raw.slice(1, 33),
		y: raw.slice(33, 65)
	};
}

/** COSE(EC2) → CryptoKey (ECDSA/P-256) */
export async function coseToCryptoKey(coseBytes: Uint8Array): Promise<CryptoKey> {
	const { x, y } = decodeCoseEc2(coseBytes);
	const raw = xyToRawUncompressed(x, y);
	return crypto.subtle.importKey(
		'raw',
		raw,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		/* extractable */ true,
		['verify']
	);
}

/** Export RAW (65)) from a COSE key */
export async function exportFromCose(coseBytes: Uint8Array) {
	const cryptoKey = await coseToCryptoKey(coseBytes);
	// RAW (65 bytes: 0x04 || X || Y)
	const raw = new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey));
	return raw;
}

/** (Optional) CryptoKey/PublicKey → COSE(EC2) using cborg */
export async function cryptoKeyToCose(cryptoKey: CryptoKey) {
	const raw = new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey));
	const { x, y } = rawToXy(raw);

	// Minimal COSE EC2 map for ES256 / P-256
	// 1: kty(2=EC2), 3: alg(-7=ES256), -1: crv(1=P-256), -2: x, -3: y
	const coseMap = new Map<number, unknown>([
		[1, 2],
		[3, -7],
		[-1, 1],
		[-2, x],
		[-3, y]
	]);

	return cborEncode(coseMap);
}

type VerifyOptions = {
	/** The challenge to verify. */
	challenge: Hex.Hex;
	/** The signature to verify. */
	signature: Signature.Signature<false>;
	/** The metadata to verify the signature with. */
	metadata: SignMetadata;
};

export function toPlainP256(options: VerifyOptions) {
	const { challenge, metadata, signature } = options;
	const { authenticatorData, challengeIndex, clientDataJSON, typeIndex, userVerificationRequired } =
		metadata;

	const authenticatorDataBytes = Bytes.fromHex(authenticatorData);

	// Check length of `authenticatorData`.
	if (authenticatorDataBytes.length < 37) return;

	const flag = authenticatorDataBytes[32]!;

	// Verify that the UP bit of the flags in authData is set.
	if ((flag & 0x01) !== 0x01) return;

	// If user verification was determined to be required, verify that
	// the UV bit of the flags in authData is set. Otherwise, ignore the
	// value of the UV flag.
	if (userVerificationRequired && (flag & 0x04) !== 0x04) return;

	// If the BE bit of the flags in authData is not set, verify that
	// the BS bit is not set.
	if ((flag & 0x08) !== 0x08 && (flag & 0x10) === 0x10) return;

	// Check that response is for an authentication assertion
	const type = '"type":"webauthn.get"';
	if (type !== clientDataJSON.slice(Number(typeIndex), type.length + 1)) return;

	// Check that hash is in the clientDataJSON.
	const match = clientDataJSON.slice(Number(challengeIndex)).match(/^"challenge":"(.*?)"/);
	if (!match) return;

	// Validate the challenge in the clientDataJSON.
	const [_, challengeExtracted] = match;
	if (Hex.fromBytes(Base64.toBytes(challengeExtracted!)) !== challenge) return;

	const clientDataJSONHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
		as: 'Bytes'
	});
	const payload = Bytes.concat(authenticatorDataBytes, clientDataJSONHash);

	return {
		payload,
		signature
	};
}
