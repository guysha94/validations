"use client";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useEffect, useState } from "react";
import { SIGN_OUT_ROUTE } from "~/lib/constants";
import { resetAllStores, useStore } from "~/store";

function PathnameResetHandler() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.includes(SIGN_OUT_ROUTE)) {
      resetAllStores();
    }
  }, [pathname]);
  return null;
}

export function StoreProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) {
      useStore.persist.rehydrate();
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <PathnameResetHandler />}
      {children}
    </>
  );
}
export default StoreProvider;
