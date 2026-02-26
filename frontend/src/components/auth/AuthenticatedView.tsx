"use server";

import { type PropsWithChildren, Suspense } from "react";
import { isAuthenticated } from "~/actions";
import Loader from "~/components/Loader";

export async function AuthenticatedView({ children }: PropsWithChildren) {
  const authenticated = await isAuthenticated();

  return (
    <Suspense fallback={<Loader fullscreen />}>
      {authenticated && children}
    </Suspense>
  );
}

export default AuthenticatedView;
