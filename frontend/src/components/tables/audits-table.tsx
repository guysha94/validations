"use client";

import type {Column, ColumnDef, ColumnFiltersState, PaginationState, SortingState,} from "@tanstack/react-table";
import {ArrowUpDown} from "lucide-react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo, useState} from "react";
import {Button} from "~/components/ui/button";
import type {AuditLog, PaginationAndSorting} from "~/domain";
import TanStackBasicTable from "./TanStackBasicTable";

function SortableHeader({
                            column,
                            title,
                        }: {
    column: Column<AuditLog>;
    title: string;
}) {
    if (!column) return null;
    return (
        <Button
            variant="ghost"
            className="cursor-pointer"
            // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {title}
            <ArrowUpDown/>
        </Button>
    );
}

export const columns: ColumnDef<AuditLog>[] = [
    {
        id: "id",
        accessorKey: "id",
        size: 320,
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
        header: ({column}) => (
            <SortableHeader column={column} title="ID"/>
        ),
    },
    {
        id: "createdAt",
        accessorKey: "createdAt",
        // size: 150,
        header: ({column}) => (
            <SortableHeader column={column} title="Created At"/>
        ),
        cell: props => (
            <span>{(props.getValue() as Date).toLocaleString()}</span>
        ),
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
    {
        id: "action",
        accessorKey: "action",
        // size: 200,
        header: ({column}) => <SortableHeader column={column} title="Action"/>,
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
    {
        id: "entityType",
        accessorKey: "entityType",
        // size: 140,
        header: ({column}) => (
            <SortableHeader column={column} title="Entity Type"/>
        ),
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
    {
        id: "entityId",
        accessorKey: "entityId",
        size: 320,
        header: ({column}) => (
            <SortableHeader column={column} title="Entity ID"/>
        ),
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
    {
        id: "actorType",
        accessorKey: "actorType",
        // size: 140,
        header: ({column}) => (
            <SortableHeader column={column} title="Actor Type"/>
        ),
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
    {
        id: "source",
        accessorKey: "source",
        // size: 140,
        header: ({column}) => <SortableHeader column={column} title="Source"/>,
        enableSorting: true,
        enableHiding: true,
        enableColumnFilter: true,
        enableMultiSort: true,
        enablePinning: true,
        enableResizing: true,
        sortDescFirst: true,
    },
];

type Props = {
    data: AuditLog[];
    rowCount: number;
    paginationAndSorting: PaginationAndSorting;
    teamSlug: string;
};

function parseSorting(value: unknown): SortingState {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

export function AuditsTable({
                                data = [],
                                rowCount = 0,
                                paginationAndSorting: {pageIndex, pageSize, sorting, q},
                                teamSlug,
                            }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const basePath = useMemo(() => `/${teamSlug}/audits`, [teamSlug]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [loading, setLoading] = useState(false);


    const pagination = useMemo(
        () => ({pageIndex, pageSize}),
        [pageIndex, pageSize],
    );

    const sortingState = useMemo(
        () => parseSorting(sorting),
        [sorting],
    );
    const setSearch = useCallback(
        (value: ((old: string) => string) | string) => {


            const actualValue = typeof value === "function" ? value(q) : value;

            console.log("Setting search to:", actualValue);
            const params = new URLSearchParams(searchParams.toString());
            if (actualValue) {
                params.set("q", actualValue);
                params.delete("pageIndex");
            } else {
                params.delete("q");
            }
            const queryString = params.toString();
            const url = `${basePath}${queryString ? `?${queryString}` : ""}`;
            console.log("Navigating to URL:", url);
            router.replace(url);
            setLoading(false);
        },
        [router, pathname, searchParams],
    );

    const handleSortingChange = useCallback(
        (newSorting: SortingState | ((old: SortingState) => SortingState)) => {
            const actualValue =
                typeof newSorting === "function" ? newSorting(sortingState) : newSorting;

            console.log("Setting sorting to:", actualValue);
            const params = new URLSearchParams(searchParams.toString());
            if (actualValue?.length) {
                params.set("sorting", JSON.stringify(actualValue));
            } else {
                params.delete("sorting");
            }
            const queryString = params.toString();
            const url = `${pathname}${queryString ? `?${queryString}` : ""}`;
            console.log("Navigating to URL:", url);
            router.replace(url);
        },
        [router, pathname, searchParams, sortingState],
    );

    const handlePaginationChange = useCallback(
        (newPagination: PaginationState | ((old: PaginationState) => PaginationState)) => {
            console.log("Received pagination change:", newPagination);
            const actualValue =
                typeof newPagination === "function" ? newPagination(pagination) : newPagination;

            console.log("Setting pagination to:", actualValue);
            const params = new URLSearchParams(searchParams.toString());
            params.set("pageIndex", actualValue.pageIndex.toString());
            params.set("pageSize", actualValue.pageSize.toString());
            const queryString = params.toString();
            const url = `${pathname}?${queryString}`;
            console.log("Navigating to URL:", url);
            router.replace(url);

        },
        [router, pathname, searchParams, pagination],
    );

    return (
        <div className="w-full">
            <TanStackBasicTable
                id={searchParams.toString()}
                isLoading={loading}
                data={data}
                columns={columns}
                sorting={sortingState}
                setSorting={handleSortingChange}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                totalRows={rowCount}
                getRowId={(row) => row.id}
                onSearchChange={setSearch}
                search={searchParams.get("q")}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
            />
        </div>
    );
}
