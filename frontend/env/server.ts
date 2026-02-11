import {createEnv} from "@t3-oss/env-nextjs";
import {z} from "zod";

// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=email_notification_bot@superplay.co
// SMTP_PASSWORD=eefktkibmiqbmtcl
// SMTP_FROM='SuperPlay <backoffice@superplay.co>'
export const env = createEnv({
    server: {
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        API_BASE_URL: z.url().default("http://localhost:3001/api"),
        BETTER_AUTH_SECRET: z.string().min(1),
        BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
        SMTP_HOST: z.string().min(1, "SMTP_HOST is required and cannot be empty"),
        SMTP_PORT: z.string().min(1, "SMTP_PORT is required and cannot be empty").refine((value) => {
            const port = parseInt(value, 10);
            return !isNaN(port) && port > 0 && port < 65536;
        }, "SMTP_PORT must be a valid port number between 1 and 65535"),
        SMTP_USER: z.string().min(1, "SMTP_USER is required and cannot be empty"),
        SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required and cannot be empty"),
        SMTP_FROM: z.string().min(1, "SMTP_FROM is required and cannot be empty"),
        MYSQL_URL: z
            .string()
            .min(1, "Please provide a valid MySQL connection string in the format: mysql://user:password@host:port/database")
            .refine((value) => {
                try {
                    const url = new URL(value);
                    return url.protocol === "mysql:";
                } catch {
                    return false;
                }
            }, "Invalid MySQL connection string format"),


    },
    skipValidation: false,
    emptyStringAsUndefined: true,
    isServer: true,
    experimental__runtimeEnv: process.env
});