import "./envConfig.ts";
import { defineConfig } from "drizzle-kit";
import env from "~/lib/env";

export default defineConfig({
  schema: "./src/db/schema/",
  out: "./migrations",
  dialect: "mysql",
  dbCredentials: {
    url: `${env.DATABASE_URL}/validations`,
  },
});
