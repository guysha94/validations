import { drizzle } from "drizzle-orm/mysql2";
import dbClient from "~/db/client";
import * as schema from "./schema";

const _logger: boolean = process.env.NODE_ENV !== "production";

const createDb = () =>
  drizzle(dbClient.validationsPool, {
    mode: "default",
    schema,
    logger: false,
  });

type Db = ReturnType<typeof createDb>;

declare global {
  var _db: Db | undefined;
}

export const db: Db = globalThis._db || createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db;
}

export default db;
