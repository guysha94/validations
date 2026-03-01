import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/lib/auth/server";

/**
 * Auth Handlers
 * @description Catch-all route delegating to better-auth for authentication flows (sign-in, sign-out, session, callbacks, credential auth).
 * @tag Auth
 * @method GET
 * @method POST
 * @openapi
 */
export const { GET, POST } = toNextJsHandler(auth);
