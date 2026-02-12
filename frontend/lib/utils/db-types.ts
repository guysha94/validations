
import {Buffer} from "buffer";
import { customType } from "drizzle-orm/mysql-core";
import slugify from "slugify";

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