import { ProtectedPage } from "~/components/auth";
import { auth } from "~/lib/auth/server";
import { headers } from "next/headers";
import { SettingsNav } from "~/components/settings/SettingsNav";

export default async function SettingsLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <ProtectedPage>
      <div className="flex min-h-svh w-full flex-col">
        <SettingsNav isAdmin={session?.user?.role === "admin"} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedPage>
  );
}
