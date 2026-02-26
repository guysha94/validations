import slugify from "slugify";

export const FAVICON_URL: Readonly<string> =
  "https://www.superplay.co/wp-content/uploads/2025/01/cropped-superplay-favicon-16x16-1-192x192.png" as const;
export const ORGANIZATION_LOGO_URL: Readonly<string> =
  "https://www.superplay.co/wp-content/uploads/2025/01/cropped-superplay-favicon-16x16-1-32x32.png" as const;
const AUTH_PREFIX: Readonly<string> = "/auth" as const;
export const SIGN_IN_ROUTE: Readonly<string> =
  `${AUTH_PREFIX}/sign-in` as const;
export const SIGN_OUT_ROUTE: Readonly<string> =
  `${AUTH_PREFIX}/sign-out` as const;
export const ROOT_ROUTE: Readonly<string> = "/" as const;
export const BETTER_AUTH_COOKIE: Readonly<string> =
  "better-auth.session_data" as const;
export const ORGANIZATION_NAME: Readonly<string> = "SuperPlay" as const;
export const ORGANIZATION_SLUG: Readonly<string> = slugify(ORGANIZATION_NAME, {
  lower: true,
});
export const ALLOWED_EMAIL_DOMAIN: Readonly<string> = "@superplay.co" as const;
export const PATHNAME_HEADER: Readonly<string> = "x-pathname" as const;
export const SIDEBAR_COOKIE: Readonly<string> = "sidebar_state" as const;
export const TEAM_NAMES: Readonly<string[]> = Object.freeze([
  "Dice Server Team",
  "Domino Server Team",
  "Disney Server Team",
]);

export const Routes = Object.freeze({
  SIGN_IN: SIGN_IN_ROUTE,
  SIGN_OUT: SIGN_OUT_ROUTE,
  ROOT: ROOT_ROUTE,
  ACCOUNT: "/account",
  ORGANIZATION: "/organization",
  EVENT: "/{0}/events/{1}",
  AUDITS: "/audits",
} as const);

export type Route = (typeof Routes)[keyof typeof Routes];
