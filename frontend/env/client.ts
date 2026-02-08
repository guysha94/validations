import {createEnv} from "@t3-oss/env-nextjs";
import {z} from "zod";

export const env = createEnv({
    client: {
        NEXT_PUBLIC_API_BASE_URL: z.url().default("/api"),
        NEXT_PUBLIC_VALIDATION_BASE_URL: z.url().default("http://localhost:3001/api/validate"),
        NEXT_PUBLIC_ENV: z.enum(["development", "staging", "production"]).default("development"),
        NEXT_PUBLIC_IS_DEV: z
            .boolean()
            .default(process.env.NEXT_PUBLIC_ENV !== "production"),
    },
    skipValidation: false,
    emptyStringAsUndefined: true,
    isServer: false,
    runtimeEnv: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENVIRONMENT,
        NEXT_PUBLIC_IS_DEV: process.env.NEXT_PUBLIC_IS_DEV,
        NEXT_PUBLIC_VALIDATION_BASE_URL: process.env.NEXT_PUBLIC_VALIDATION_BASE_URL,
    },
});