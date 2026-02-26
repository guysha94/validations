"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { CookiesProvider } from "react-cookie";
import type { Optional } from "~/domain";
import { authClient } from "~/lib/auth/client";
import { ROOT_ROUTE } from "~/lib/constants";

const customRoles = [{ role: "viewer", label: "Viewer" }];

type Props = {
  redirectTo?: Optional<string>;
};

export default function AuthProvidersClient({
  children,
  redirectTo = "/",
}: PropsWithChildren<Props>) {
  const router = useRouter();

  return (
    <CookiesProvider>
      <AuthUIProvider
        authClient={authClient}
        credentials={false}
        navigate={router.push}
        replace={router.replace}
        social={{ providers: ["google"] }}
        onSessionChange={() => {
          router.refresh();
        }}
        account
        organization={{
          pathMode: "default",
          customRoles,
        }}
        redirectTo={redirectTo || ROOT_ROUTE}
        signUp={false}
        teams={{ enabled: true, customRoles }}
        Link={Link}
      >
        {children}
      </AuthUIProvider>
    </CookiesProvider>
  );
}
