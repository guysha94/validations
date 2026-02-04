"use client";
import {PropsWithChildren} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {getQueryClient} from '~/lib/query-client';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {ReactQueryStreamedHydration} from '@tanstack/react-query-next-experimental'
import {env} from "~/env/client";

export default function QueryProvider({children}: PropsWithChildren) {

    const queryClient = getQueryClient()


    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryStreamedHydration>
                {children}

                {env.NEXT_PUBLIC_IS_DEV && <ReactQueryDevtools initialIsOpen client={queryClient}/>}
            </ReactQueryStreamedHydration>
        </QueryClientProvider>
    );
}
