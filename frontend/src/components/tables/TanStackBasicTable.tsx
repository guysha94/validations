"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import {
  parseAsIndex,
  parseAsInteger,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import Loader from "~/components/Loader";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import TanStackBasicTableTableComponent from "./TanStackBasicTableTableComponent";

type Props<T> = {
  data?: T[];
  columns: ColumnDef<T, any>[];
  sorting: SortingState;
  setSorting?: OnChangeFn<SortingState> | undefined;
  columnFilters?: ColumnFiltersState | undefined;
  totalRows?: number | undefined;
  setColumnFilters?: OnChangeFn<ColumnFiltersState> | undefined;
  isLoading?: boolean;
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function TanStackBasicTable<T>({
  data = [],
  columns,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
  totalRows = 0,
  isLoading = false,
}: Props<T>) {
  // const router = useRouter();
  // const searchRef = useRef<HTMLInputElement>(null);
  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsIndex.withDefault(0),
      pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    },
    {
      history: "push",
      shallow: false,
    },
  );
  const [search, setSearch] = useQueryState("q", {
    history: "push",
    shallow: false,
    defaultValue: "",
  });

  const [rowCount, pageCount] = useMemo(() => {
    const total = totalRows || data?.length || 0;
    const pageCount = Math.ceil(total / pagination.pageSize);
    return [total, pageCount];
  }, [totalRows, data, pagination]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),

    // Sort configuration
    onSortingChange: setSorting,
    enableMultiSort: true,
    manualSorting: true,
    sortDescFirst: true,

    // Filter configuration
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    manualFiltering: true,

    // Pagination configuration
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    rowCount,
    pageCount,
    manualPagination: true,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          // ref={searchRef}
          placeholder="Search"
          value={search}
          onChange={async (e) => await setSearch(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={column.toggleVisibility}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="max-h-[60dvh] overflow-auto rounded-md border">
        {isLoading ? (
          <Loader />
        ) : (
          <TanStackBasicTableTableComponent table={table} />
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div>
          <Select
            defaultValue={pagination.pageSize.toString()}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="w-full max-w-48">
              <SelectValue
                placeholder="Items per page"
                defaultValue={pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Items per page</SelectLabel>
                {PAGE_SIZE_OPTIONS.map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
