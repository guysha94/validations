import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {customType} from 'drizzle-orm/mysql-core';
import {Buffer} from 'buffer';
import slugify from 'slugify';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


function uuidStringify(arr: Uint8Array): string {

    const hex = Buffer.from(arr).toString('hex');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}

export const uuidBinary = customType<{ data: string; driverData: Buffer }>({
    dataType() {
        return "binary(16)";
    },

    toDriver(value: string): Buffer<ArrayBufferLike> {
        return Buffer.from(value.replace(/-/g, ''), 'hex');
    },
    fromDriver(value: Buffer): string {
        return uuidStringify(new Uint8Array(value));
    },
});

export const tinyintBool = customType<{ data: boolean; driverData: number }>({
    dataType() {
        return "tinyint(1)";
    },

    toDriver(value: boolean): number {
        return value ? 1 : 0;
    },
    fromDriver(value: number): boolean {
        return value === 1;
    },
});

export const slugVarchar = customType<{ data: string; driverData: string, config: { length?: number }; }>({
    dataType(config?: { length?: number }) {
        return `varchar(${config?.length ?? 255})`;
    },

    toDriver(value: string): string {
        return slugify(value, {lower: true, strict: true});
    },
});
export const slugText = customType<{ data: string; driverData: string }>({
    dataType() {
        return "text";
    },

    toDriver(value: string): string {
        return slugify(value, {lower: true, strict: true});
    },
});


let _lastMs = -1;
let _lastRandA = 0;

function getCrypto(): Crypto {
    // Works in browsers and Node 19+ (or Node 16+ with globalThis.crypto set to webcrypto).
    const c = (globalThis as any).crypto as Crypto | undefined;
    if (!c?.getRandomValues) {
        throw new Error(
            "crypto.getRandomValues is not available. In Node, set globalThis.crypto = require('node:crypto').webcrypto"
        );
    }
    return c;
}

function toHex(bytes: Uint8Array): string {
    // 16 bytes => 32 hex chars
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i]!;
        hex += (b >>> 4).toString(16);
        hex += (b & 0x0f).toString(16);
    }
    // 8-4-4-4-12
    return (
        hex.slice(0, 8) +
        "-" +
        hex.slice(8, 12) +
        "-" +
        hex.slice(12, 16) +
        "-" +
        hex.slice(16, 20) +
        "-" +
        hex.slice(20)
    );
}

function randomUint12(crypto: Crypto): number {
    const b = new Uint8Array(2);
    crypto.getRandomValues(b);
    return ((b[0]! << 8) | b[1]!) & 0x0fff;
}

/**
 * Generate a UUIDv7 string (canonical text form).
 *
 * @param nowMs Optional timestamp override (Unix ms). Defaults to Date.now().
 */
export function uuidv7(nowMs: number = Date.now()): string {
    if (!Number.isFinite(nowMs) || nowMs < 0 || nowMs > 0xffff_ffff_ffff) {
        throw new RangeError("nowMs must be a finite Unix-epoch millisecond value in [0, 2^48).");
    }

    const crypto = getCrypto();
    const bytes = new Uint8Array(16);

    // ---- unix_ts_ms (48-bit big-endian) ----
    // Put timestamp into bytes[0..5]
    const t = Math.floor(nowMs);
    bytes[0] = (t / 2 ** 40) & 0xff;
    bytes[1] = (t / 2 ** 32) & 0xff;
    bytes[2] = (t / 2 ** 24) & 0xff;
    bytes[3] = (t / 2 ** 16) & 0xff;
    bytes[4] = (t / 2 ** 8) & 0xff;
    bytes[5] = t & 0xff;

    // ---- rand_a (12-bit) with monotonicity within same millisecond ----
    let randA: number;
    if (t === _lastMs) {
        // increment counter (mod 4096)
        _lastRandA = (_lastRandA + 1) & 0x0fff;
        randA = _lastRandA;
    } else {
        _lastMs = t;
        _lastRandA = randomUint12(crypto);
        randA = _lastRandA;
    }

    // ---- version (4 bits) + rand_a high 4 bits ----
    // byte[6] high nibble = 0b0111 (v7), low nibble = randA[11..8]
    bytes[6] = (0x7 << 4) | ((randA >>> 8) & 0x0f);
    // byte[7] = randA[7..0]
    bytes[7] = randA & 0xff;

    // ---- rand_b (62-bit random) + variant bits ----
    crypto.getRandomValues(bytes.subarray(8, 16));

    // Set variant to IETF (10xxxxxx) in byte[8] top bits
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return toHex(bytes);
}

/**
 * Optional: get the raw RFC-ordered bytes (same bytes used for the string).
 */
export function uuidv7Bytes(nowMs: number = Date.now()): Uint8Array {
    const id = uuidv7(nowMs);
    return parseUuid(id);
}

/**
 * Parse canonical UUID string to RFC-ordered bytes (big-endian field order).
 */
export function parseUuid(uuid: string): Uint8Array {
    const s = uuid.replace(/-/g, "").toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(s)) throw new Error("Invalid UUID string");
    const out = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        const hi = parseInt(s[i * 2]!, 16);
        const lo = parseInt(s[i * 2 + 1]!, 16);
        out[i] = (hi << 4) | lo;
    }
    return out;
}

