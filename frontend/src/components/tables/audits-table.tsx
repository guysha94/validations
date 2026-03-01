"use client";

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import type { AuditLog, PaginationAndSorting } from "~/domain";
import TanStackBasicTable from "./TanStackBasicTable";

function SortableHeader({
  column,
  title,
}: {
  column: Column<AuditLog>;
  title: string;
}) {
  if(!column) return null;
  return (
    <Button
      variant="ghost"
      className="cursor-pointer"
      // onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown />
    </Button>
  );
}

export const columns: ColumnDef<AuditLog>[] = [
  {
    id: "select",
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    enableHiding: true,
    enableColumnFilter: true,
    enableMultiSort: true,
    enablePinning: true,
    enableResizing: true,
    sortDescFirst: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} title="Created At" />
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
    accessorKey: "action",
    header: ({ column }) => <SortableHeader column={column} title="Action" />,
    enableSorting: true,
    enableHiding: true,
    enableColumnFilter: true,
    enableMultiSort: true,
    enablePinning: true,
    enableResizing: true,
    sortDescFirst: true,
  },
  {
    accessorKey: "entityType",
    header: ({ column }) => (
      <SortableHeader column={column} title="Entity Type" />
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
    accessorKey: "entityId",
    header: ({ column }) => (
      <SortableHeader column={column} title="Entity ID" />
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
    accessorKey: "actorType",
    header: ({ column }) => (
      <SortableHeader column={column} title="Actor Type" />
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
    accessorKey: "source",
    header: ({ column }) => <SortableHeader column={column} title="Source" />,
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

type QueryBuilderParams = {
  pagination: PaginationState;
  sorting: SortingState;
  search: string;
};

function buildQuery({ pagination, sorting, search }: QueryBuilderParams) {
  const query = new URLSearchParams();
  query.set("page", pagination.pageIndex.toString());
  query.set("pageSize", pagination.pageSize.toString());
  if (search?.length) query.set("q", search);
  if (sorting?.length) query.set("sorting", JSON.stringify(sorting));
  return query.toString();
}

export function AuditsTable({
  data = [],
  rowCount = 0,
  paginationAndSorting: { pageIndex = 0, pageSize = 10, sorting = [], q = "" },
  teamSlug,
}: Props) {
  const router = useRouter();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // const [search, setSearch] = useState("");

  const basePath = useMemo(() => `/${teamSlug}/audits`, [teamSlug]);

  const pagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  const handleSortingChange = useCallback(
    (newSorting: SortingState | ((old: SortingState) => SortingState)) => {
      const actualValue =
        typeof newSorting === "function" ? newSorting(sorting) : newSorting;

      if (JSON.stringify(actualValue) === JSON.stringify(sorting)) return;

      const query = buildQuery({
        pagination,
        sorting: actualValue,
        search: q,
      });

      router.push(`${basePath}?${query}`);
    },
    [router, basePath, pagination, q, sorting],
  );

  return (
    <div className="w-full">
      <TanStackBasicTable
        isLoading={false}
        data={data}
        columns={columns}
        sorting={sorting}
        setSorting={handleSortingChange}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        totalRows={rowCount}
      />
    </div>
  );
}
