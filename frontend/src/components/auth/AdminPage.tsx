import { redirect, unauthorized } from "next/navigation";
import { type PropsWithChildren, Suspense } from "react";
import { getSession } from "~/actions";
import Loader from "~/components/Loader";
import { Roles } from "~/domain";
import { SIGN_IN_ROUTE } from "~/lib/constants";

export async function AdminPage({ children }: PropsWithChildren) {
  const session = await getSession();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }
  if (session.user.role !== Roles.ADMIN) {
    return unauthorized();
  }

  return <Suspense fallback={<Loader fullscreen />}>{children}</Suspense>;
}

export default AdminPage;
