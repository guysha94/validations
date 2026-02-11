export const ALLOWED_EMAIL_DOMAIN: Readonly<string> = "@superplay.co" as const;
export const ROLES: Readonly<string[]> = ["owner", "admin", "member", "viewer"] as const;
export const ORG_SLUG: Readonly<string> = "superplay" as const;


const AUTH_PREFIX: Readonly<string> = "/auth" as const;
export const SIGN_IN_ROUTE: Readonly<string> = `${AUTH_PREFIX}/sign-in` as const;
export const SIGN_OUT_ROUTE: Readonly<string> = `${AUTH_PREFIX}/sign-out` as const;
export const ROOT_ROUTE: Readonly<string> = "/" as const;
export const FAVICON_URL: Readonly<string> = "https://www.superplay.co/wp-content/uploads/2025/01/cropped-superplay-favicon-16x16-1-192x192.png" as const;
export const ALLOWED_ROLES: Readonly<string[]> = ["owner", "admin", "member", "viewer"] as const;