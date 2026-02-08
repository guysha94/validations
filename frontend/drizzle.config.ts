import "dotenv/config";
import {defineConfig} from "drizzle-kit";


let url = process.env.MYSQL_URL;

if (!url?.startsWith("mysql://")) {
    throw new Error("Please provide a valid MySQL connection string in the format: mysql://user:password@host:port/database");
}

if (!url.includes("/validations")) {
    const urlObj = new URL(url);
    urlObj.pathname = "/validations";
    url = urlObj.toString();
}


export default defineConfig({
    schema: "./lib/db/schema",
    out: "./lib/db/migrations",
    dialect: 'mysql',
    dbCredentials: {
        url,
    }
});