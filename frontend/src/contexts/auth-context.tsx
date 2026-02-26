"use client";
import type { SessionQueryParams } from "better-auth";
import type { BetterFetchError } from "better-auth/react";
import { useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useShallow } from "zustand/react/shallow";
import type {
  DbSession,
  FullOrganization,
  Optional,
  Team,
  User,
} from "~/domain";
import { authClient } from "~/lib/auth/client";
import {
  ORGANIZATION_SLUG,
  ROOT_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_OUT_ROUTE,
} from "~/lib/constants";
import { useStore } from "~/store";

export type ContextType = {
  signOut: () => Promise<void>;
  signin: () => void;
  session?: Optional<DbSession>;
  user?: Optional<User>;
  organizationRole: Optional<string>;
  isPending: boolean;
  isRefetching: boolean;
  error: BetterFetchError | null;
  refetch: (
    queryParams?:
      | {
          query?: SessionQueryParams;
        }
      | undefined,
  ) => Promise<void>;
  organization: Optional<FullOrganization>;
  activeTeam: Optional<Team>;
};

export const authContext = createContext<ContextType | undefined>(undefined);

export function AuthContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { activeTeam, setActiveTeam, setIsAuthenticated } = useStore(
    useShallow((state) => state),
  );
  const [organization, setOrganization] = useState<FullOrganization | null>(
    null,
  );
  const { data, isPending, refetch, ...rest } = authClient.useSession();
  const { data: organizationRole } = authClient.useActiveMemberRole();

  const handleSetActiveOrg = useCallback(async () => {
    const { data, error } = await authClient.organization.setActive({
      organizationSlug: ORGANIZATION_SLUG,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error setting active organization:", error);
      }
      router.push(SIGN_IN_ROUTE);
      return;
    }
    if (!data) {
      router.push(SIGN_IN_ROUTE);
      return;
    }
    const { data: org, error: orgError } =
      await authClient.organization.getFullOrganization({
        query: { organizationSlug: ORGANIZATION_SLUG },
      });
    if (orgError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching organization details:", orgError);
      }
      router.push(SIGN_IN_ROUTE);
      return;
    }
    if (!org) {
      router.push(SIGN_IN_ROUTE);
      return;
    }
    setOrganization(org as FullOrganization);
  }, [router]);

  useEffect(() => {
    if (isPending || !data) return;
    const team = organization?.teams?.find(
      (team) => team.id === data?.session?.activeTeamId,
    ) as Team;
    setActiveTeam(team);
  }, [
    isPending,
    data?.session?.activeTeamId,
    organization,
    setActiveTeam,
    data,
  ]);

  useEffect(() => {
    if (!isPending && !data) return;
    if (!isPending && !organization) {
      startTransition(() => handleSetActiveOrg());
    }
  }, [isPending, organization, handleSetActiveOrg, data]);

  useEffect(() => {
    if (isPending) return;
    setIsAuthenticated(!!data?.session);
  }, [isPending, data?.session, setIsAuthenticated]);

  const signOut = useCallback(async () => {
    router.push(SIGN_OUT_ROUTE);
  }, [router]);

  const signin = useCallback(
    () =>
      authClient.signIn.social({
        provider: "google",
        callbackURL: ROOT_ROUTE,
      }),
    [],
  );

  return (
    <authContext.Provider
      value={{
        signOut,
        signin,
        isPending,
        organizationRole: organizationRole?.role,
        refetch,
        organization,
        activeTeam,
        ...data,
        ...rest,
      }}
    >
      {children}
    </authContext.Provider>
  );
}
