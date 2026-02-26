import { redirect } from "next/navigation";
import { type PropsWithChildren, Suspense } from "react";
import { getSession } from "~/actions";
import AuthenticatedView from "~/components/auth/AuthenticatedView";
import Loader from "~/components/Loader";
import { SIGN_IN_ROUTE } from "~/lib/constants";

export async function ProtectedPage({ children }: PropsWithChildren) {
  const session = await getSession();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  return <Suspense fallback={<Loader fullscreen />}>{children}</Suspense>;
}

export default AuthenticatedView;
