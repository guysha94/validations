"use client";

import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ColumnPinningState,
    type ColumnSizingState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type OnChangeFn,
    type PaginationState,
    type SortingState, Updater,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import {ChevronDown} from "lucide-react";
import {type InputEvent, type InputEventHandler, useCallback, useEffect, useMemo, useRef, useState,} from "react";
import Loader from "~/components/Loader";
import {Button} from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {Input} from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {useDebouncedCallback} from "~/hooks";
import TanStackBasicTableTableComponent from "./TanStackBasicTableTableComponent";
import {uuidv7} from "uuidv7";

type Props<T> = {
    data?: T[];
    columns: ColumnDef<T, any>[];
    sorting: SortingState;
    setSorting?: OnChangeFn<SortingState> | undefined;
    columnFilters?: ColumnFiltersState | undefined;
    totalRows?: number | undefined;
    setColumnFilters?: OnChangeFn<ColumnFiltersState> | undefined;
    isLoading?: boolean;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>
    /** Use stable row IDs from data for React keys. Required when data changes (e.g. search) to avoid stale row content. */
    getRowId?: (originalRow: T, index: number) => string;
    search?: string | null | undefined;
    onSearchChange?: OnChangeFn<string> | undefined;
    id?: string | undefined;
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SEARCH_DEBOUNCE_MS = 300;

export default function TanStackBasicTable<T>({
                                                  data = [],
                                                  columns,
                                                  sorting,
                                                  setSorting,
                                                  columnFilters,
                                                  setColumnFilters,
                                                  totalRows = 0,
                                                  isLoading = false,
                                                  getRowId,
                                                  pagination = {pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE},
                                                  onPaginationChange,
                                                  search,
                                                  onSearchChange,
                                                  id

                                              }: Props<T>) {

    const searchRef = useRef<HTMLInputElement>(null);
    const [localSearch, setLocalSearch] = useState(search);
    const [key, setKey] = useState<string | undefined>(id);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        columns.reduce((acc, column) => {
            acc[column.id!] = true;
            return acc;
        }, {} as VisibilityState),
    );
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
        columns.map((c) => c.id!).filter(Boolean),
    );
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        left: [],
        right: [],
    });
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});


    useEffect(() => {
        setLocalSearch(search);
        searchRef?.current?.focus();
    }, [search]);

    const applySearch = useCallback(
        async (value: string) => {
            onSearchChange?.(value);
        },
        [onSearchChange],
    );

    const debouncedApplySearch = useDebouncedCallback(
        applySearch,
        SEARCH_DEBOUNCE_MS,
    );

    const [rowCount, pageCount] = useMemo(() => {
        const total = totalRows || data?.length || 0;
        const pageCount = Math.ceil(total / pagination!.pageSize);
        return [total, pageCount];
    }, [totalRows, data, pagination]);

    const onColumnVisibilityChange = useCallback((updater:Updater<VisibilityState>)=>{
        setColumnVisibility((prev) => typeof updater === "function" ? updater(prev) : updater);
        setKey((prev) => `${prev}=${uuidv7()}`);
    }, [setKey, setColumnVisibility]);

    const onColumnOrderChange = useCallback((updater:Updater<ColumnOrderState>)=>{
        setColumnOrder((prev) => typeof updater === "function" ? updater(prev) : updater);
        setKey((prev) => `${prev}=${uuidv7()}`);
    }, [setKey, setColumnOrder]);

    const onColumnPinningChange = useCallback((updater:Updater<ColumnPinningState>)=>{
        setColumnPinning((prev) => typeof updater === "function" ? updater(prev) : updater);
        setKey((prev) => `${prev}=${uuidv7()}`);
    }, [setKey, setColumnPinning]);

    const onColumnSizingChange = useCallback((updater:Updater<ColumnSizingState>)=>{
        setColumnSizing((prev) => typeof updater === "function" ? updater(prev) : updater);
        setKey((prev) => `${prev}=${uuidv7()}`);
    }, [setKey, setColumnSizing]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable<T>({
        data,
        columns,
        defaultColumn: { minSize: 80, maxSize: 1200, size: 200 },
        getCoreRowModel: getCoreRowModel(),
        getRowId,

        // Sort configuration
        onSortingChange: setSorting,
        enableMultiSort: true,
        manualSorting: true,
        sortDescFirst: true,
        enableColumnFilters: true,
        enableColumnResizing: true,
        enableColumnPinning: true,
        columnResizeMode: "onEnd",

        // Filter configuration
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        manualFiltering: true,
        enableGlobalFilter: true,
        enableFilters: true,
        enableExpanding: true,
        enableHiding: true,
        enableSorting: true,
        enableSortingRemoval: true,
        onColumnVisibilityChange,

        // Pagination configuration
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange,
        rowCount,
        pageCount,
        manualPagination: true,
        state: {
            sorting: Array.isArray(sorting) ? sorting : [],
            pagination,
            columnFilters,
            columnVisibility,
            columnOrder,
            columnPinning,
            columnSizing,
        },
        onColumnOrderChange,
        onColumnPinningChange,
        onColumnSizingChange,
    });

    const handleSearchInput: InputEventHandler = useCallback(
        (e: InputEvent<HTMLInputElement>) => {
            const value = (e.target as HTMLInputElement).value;
            setLocalSearch(value);
            debouncedApplySearch(value);
        },
        [debouncedApplySearch],
    );

    useEffect(() => {
        setKey(id);
    }, [id, setKey]);

    if (!pagination) return null;

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Search"
                    ref={searchRef}
                    value={localSearch || ""}
                    onInput={handleSearchInput}
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown/>
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
                    <Loader/>
                ) : (
                    <TanStackBasicTableTableComponent table={table} key={key}/>
                )}
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div>
                    <Select
                        value={pagination!.pageSize.toString()}
                        onValueChange={(v) => table.setPageSize(Number(v))}
                    >
                        <SelectTrigger className="w-full max-w-48">
                            <SelectValue placeholder="Items per page"/>
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

