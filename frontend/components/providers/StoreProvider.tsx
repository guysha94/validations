"use client";
import {PropsWithChildren, useEffect} from "react";
import {resetAllStores} from "~/store";
import {usePathname} from "next/navigation";
import {SIGN_OUT_ROUTE} from "~/lib/constants";

export default function StoreProvider({children}: PropsWithChildren) {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname?.includes(SIGN_OUT_ROUTE)) {
            resetAllStores();
        }
    }, [pathname]);

    // Always render children to keep tree structure consistent; returning null
    // causes "Rendered more hooks than during the previous render" when the
    // tree switches from empty to full after zustand persist hydration.
    return <>{children}</>;
}