"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import {
    canEdit as canEditRole,
    isViewerOnly,
    hasPermission,
    type UserWithRoles,
    type Permissions,
} from "~/domain/permissions";

type UsePermissionsOptions = {
    eventSlug?: string;
    eventExists?: boolean;
};

type UsePermissionsReturn = {
    canEdit: boolean | undefined;
    isLoading: boolean;
    isViewerOnly: (role: string | null) => boolean;
    hasPermission: <Resource extends keyof Permissions>(
        user: UserWithRoles,
        resource: Resource,
        action: Permissions[Resource]["action"],
        data?: Permissions[Resource]["dataType"]
    ) => boolean;
};

export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsReturn {
    const { eventSlug, eventExists = true } = options;

    const { data: canEditData, isLoading: isCanEditLoading } = useQuery({
        queryKey: ["event-can-edit", eventSlug],
        queryFn: () => api.events.canEdit(eventSlug!),
        enabled: !!eventSlug && !!eventExists,
    });

    const canEdit = useMemo(
        () => (canEditData ? canEditData.canEdit : undefined),
        [canEditData]
    );

    return {
        canEdit,
        isLoading: isCanEditLoading,
        isViewerOnly,
        hasPermission,
    };
}

export { canEditRole as canEdit };
