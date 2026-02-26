"use server";

import { type PropsWithChildren, Suspense } from "react";
import { getSession } from "~/actions";
import Loader from "~/components/Loader";
import { Roles } from "~/domain";

export async function AdminView({ children }: PropsWithChildren) {
  const session = await getSession();

  return (
    <Suspense fallback={<Loader fullscreen />}>
      {session?.user?.role === Roles.ADMIN && children}
    </Suspense>
  );
}

export default AdminView;
