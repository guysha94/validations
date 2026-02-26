import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    API_BASE_URL: z.url().default("http://localhost:3001/api"),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required and cannot be empty"),
    SMTP_PORT: z
      .string()
      .min(1, "SMTP_PORT is required and cannot be empty")
      .refine((value) => {
        const port = parseInt(value, 10);
        return !Number.isNaN(port) && port > 0 && port < 65536;
      }, "SMTP_PORT must be a valid port number between 1 and 65535"),
    SMTP_USER: z.string().min(1, "SMTP_USER is required and cannot be empty"),
    SMTP_PASSWORD: z
      .string()
      .min(1, "SMTP_PASSWORD is required and cannot be empty"),
    SMTP_FROM: z.string().min(1, "SMTP_FROM is required and cannot be empty"),
    DATABASE_URL: z
      .string()
      .min(
        1,
        "Please provide a valid MySQL connection string in the format: mysql://user:password@host:port/database",
      )
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === "mysql:";
        } catch {
          return false;
        }
      }, "Invalid connection string format. Expected format: mysql://user:password@host:port/database"),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url().default(""),
    NEXT_PUBLIC_VALIDATION_BASE_URL: z.url().default("http://localhost:3001"),
    NEXT_PUBLIC_ENV: z
      .enum(["development", "staging", "production"])
      .default("development"),
    NEXT_PUBLIC_IS_DEV: z
      .boolean()
      .default(process.env.NEXT_PUBLIC_ENV !== "production"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_IS_DEV: process.env.NEXT_PUBLIC_IS_DEV,
    NEXT_PUBLIC_VALIDATION_BASE_URL:
      process.env.NEXT_PUBLIC_VALIDATION_BASE_URL,
  },
  skipValidation: false,
  emptyStringAsUndefined: true,
});

export default env;
