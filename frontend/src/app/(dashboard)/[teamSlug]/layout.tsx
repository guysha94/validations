import { connection } from "next/server";
import type { PropsWithChildren } from "react";
import { AuthContextProvider } from "~/contexts";
import { EventsContextProvider } from "~/contexts/events-context";

type Params = {
  teamSlug: string;
};

type PageProps = {
  params: Promise<Params>;
};

export default async function Layout({
  children,
  params,
}: PropsWithChildren<PageProps>) {
  await connection();

  const { teamSlug } = await params;

  return (
    <AuthContextProvider>
        {children}
    </AuthContextProvider>
  );
}
