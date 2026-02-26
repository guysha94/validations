import type { DbSession, User } from "./db-types";

export const Roles = Object.freeze({
  MEMBER: "member",
  ADMIN: "admin",
  OWNER: "owner",
});

export type Role = (typeof Roles)[keyof typeof Roles];

export type Session = {
  session: DbSession;
  user: User;
};
