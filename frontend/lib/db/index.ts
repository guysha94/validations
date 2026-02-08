import "server-only";

import {drizzle} from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {env} from "@/env/server";
import * as schema from "./schema";

const dbConfig: Readonly<Partial<mysql.PoolOptions>> = Object.freeze({
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
    idleTimeout: 180_000,
} as const);

const validationsDbConnectionPool = mysql.createPool({
    uri: env.MYSQL_URL,
    database: "validations",
    ...dbConfig,
});

const backendDbConnectionPool = mysql.createPool({
    uri: env.MYSQL_URL,
    database: "backend",
    ...dbConfig,
});

export const validationsDb = drizzle(validationsDbConnectionPool, {
    schema,
    mode: "default",
    logger: false,
});

export const backendDb = drizzle(backendDbConnectionPool, {
    mode: "default",
    logger: false,
});

export const db = {
    validations: validationsDb,
    backend: backendDb,
};

export default db;