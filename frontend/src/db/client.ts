import mysql from "mysql2/promise";
import { Singleton } from "~/lib/decorators";
import env from "~/lib/env";

@Singleton
class DbClient {
  public readonly validationsPool: mysql.Pool;
  public readonly backendPool: mysql.Pool;

  constructor() {
    const dbConfig: mysql.PoolOptions = {
      waitForConnections: true,
      connectionLimit: 100,
      queueLimit: 0,
      idleTimeout: 180_000,
    };
    this.validationsPool = mysql.createPool({
      uri: env.DATABASE_URL,
      database: "validations",
      ...dbConfig,
    });

    this.backendPool = mysql.createPool({
      uri: env.DATABASE_URL,
      database: "backend",
      ...dbConfig,
    });
  }
}

export default new DbClient();
