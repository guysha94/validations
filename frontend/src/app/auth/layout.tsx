import { connection } from "next/server";
import type { PropsWithChildren } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
  await connection();

  return children;
}
