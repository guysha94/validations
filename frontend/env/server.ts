import {createEnv} from "@t3-oss/env-nextjs";
import {z} from "zod";

export const env = createEnv({
    server: {
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        API_BASE_URL: z.url().default("http://localhost:3001/api"),
        NEXTAUTH_SECRET: z.string().min(1)
    },
    skipValidation: false,
    emptyStringAsUndefined: true,
    isServer: true,
    experimental__runtimeEnv: process.env
});