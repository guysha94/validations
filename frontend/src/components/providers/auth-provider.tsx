import type { PropsWithChildren } from "react";
import { getTeamSlugs } from "~/actions";
import { AuthContextProvider } from "~/contexts";
import { Routes } from "~/lib/constants";
import AuthProvidersClient from "./auth-provider-client";

export default async function AuthProvider({ children }: PropsWithChildren) {
  const { data, error } = await getTeamSlugs();

  if (error) {
    console.error("Error fetching team slugs:", error);
  }

  const teamsSlugs = data || [""];
  const redirectTo = `${Routes.ROOT}${teamsSlugs[0]}`;

  return (
    <AuthContextProvider>
      <AuthProvidersClient redirectTo={redirectTo}>
        {children}
      </AuthProvidersClient>
    </AuthContextProvider>
  );
}
