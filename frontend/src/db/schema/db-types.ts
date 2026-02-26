import { Buffer } from "node:buffer";
import { type SQL, sql } from "drizzle-orm";
import { customType } from "drizzle-orm/mysql-core";
import slugify from "slugify";
import type { JSONArray, JSONObject, JSONValue } from "~/domain";

function uuidStringify(arr: Uint8Array): string {
  const hex = Buffer.from(arr).toString("hex");
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}

export const uuidBinary = customType<{ data: string; driverData: Buffer }>({
  dataType() {
    return "binary(16)";
  },

  toDriver(value: string): Buffer<ArrayBufferLike> {
    return Buffer.from(value.replace(/-/g, ""), "hex");
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

export const slugVarchar = customType<{
  data: string;
  driverData: string;
  config: { length?: number };
}>({
  dataType(config?: { length?: number }) {
    return `varchar(${config?.length ?? 255})`;
  },

  toDriver(value: string): string {
    return slugify(value, { lower: true, strict: true });
  },
});

export const uuidv7Binary = customType<{ data: string; driverData: Buffer }>({
  dataType() {
    return "binary(16)";
  },

  toDriver(value: string): SQL {
    if (value.length === 36) {
      return sql`UUID_TO_BIN
            (
            ${value},
            1
            )`;
    } else if (value.length === 32) {
      return sql`UUID_TO_BIN
            (
            ${value},
            0
            )`;
    } else {
      throw new Error("Invalid UUID string length");
    }
  },
  fromDriver(value: Buffer): string {
    return uuidStringify(new Uint8Array(value));
  },
});

export const jsonColumn = customType<{ data: JSONValue; driverData: string }>({
  dataType() {
    return "json";
  },
  toDriver(value: JSONValue): string {
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  },
  fromDriver(value: unknown): JSONValue {
    if (typeof value === "string") return JSON.stringify(value);
    return value as JSONValue;
  },
});

export const jsonArrayColumn = customType<{
  data: JSONArray;
  driverData: string;
}>({
  dataType() {
    return "json";
  },
  toDriver(value: JSONArray): string {
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  },
  fromDriver(value: unknown): JSONArray {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value as JSONArray;
  },
});

export const jsonObjectColumn = customType<{
  data: JSONObject;
  driverData: string;
}>({
  dataType() {
    return "json";
  },

  toDriver(value: JSONObject): string {
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  },
  fromDriver(value: unknown): JSONObject {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value as JSONObject;
  },
});
