'use client';
import {useCallback, useTransition} from "react";
import {authClient} from "~/lib/auth/client";
import {useRouter} from 'next/navigation';
import {type AuthSession, type AuthUser} from "~/domain";
import {type BetterFetchError} from "better-auth/react";
import {SessionQueryParams} from "better-auth";
import {SIGN_IN_ROUTE, SIGN_OUT_ROUTE} from "~/lib/constants";
import {auth} from "~/lib/auth/server";


type UseAuthReturnType = {
    logout: () => Promise<void>;
    signin: () => void;
    session?: AuthSession | null | undefined;
    user?: AuthUser | null | undefined;
    isPending: boolean;
    isRefetching: boolean;
    error: BetterFetchError | null,
    refetch: (queryParams?: ({
        query?: SessionQueryParams
    } | undefined)) => Promise<void>
};

export function useAuth(): UseAuthReturnType {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const {data, ...rest} = authClient.useSession();





    const signOut = useCallback(async () => {
        router.push(SIGN_OUT_ROUTE);
    }, [router]);


    const signin = useCallback(() => {
        startTransition(async () => {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: SIGN_IN_ROUTE,
            });
            const url = result?.data && "url" in result.data ? result.data.url : undefined;
            if (url) {

                const queryParams = new URLSearchParams(new URL(url).search);
                const redirectTo = queryParams.get('redirectTo');
                if (!!redirectTo?.length) {
                    router.push(redirectTo);
                } else {
                    const teams = await authClient.organization.listUserTeams();
                    const teamSlug = teams?.[0]?.slug;
                    router.push(teamSlug ? `/${teamSlug}` : '/select-team');
                }


            }
        });
    }, [router]);
    return {logout: signOut, signin, ...data, ...rest};
}