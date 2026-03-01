"use client";

import type {Cell, Column} from "@tanstack/react-table";
import {
    flexRender,
    type Header,
    type Table as TableType,
} from "@tanstack/react-table";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {restrictToHorizontalAxis} from "@dnd-kit/modifiers";
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable,} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type {CSSProperties} from "react";
import {GripVertical, Pin, PinOff} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "~/components/ui/dropdown-menu";
import {Button} from "~/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "~/components/ui/table";
import {cn} from "~/lib/utils";
import dynamic from "next/dynamic";
import Loader from "~/components/Loader";
function getCommonPinningStyles<TData>(column: Column<TData>): CSSProperties {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === "left" && column.getIsLastColumn("left");
    const isFirstRightPinnedColumn =
        isPinned === "right" && column.getIsFirstColumn("right");

    const borderShadow = isLastLeftPinnedColumn
        ? "-4px 0 4px -4px hsl(var(--border)) inset"
        : isFirstRightPinnedColumn
            ? "4px 0 4px -4px hsl(var(--border)) inset"
            : null;
    const bgShadow = isPinned
        ? "inset 0 0 0 9999px hsl(var(--background))"
        : null;
    const boxShadow =
        borderShadow && bgShadow
            ? `${borderShadow}, ${bgShadow}`
            : borderShadow ?? bgShadow ?? undefined;

    return {
        boxShadow,
        left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
        right:
            isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
        position: isPinned ? "sticky" : "relative",
        width: column.getSize(),
        minWidth: column.getSize(),
        maxWidth: column.getSize(),
        zIndex: isPinned ? 1001 : 0,
        ...(isPinned && {
            backgroundColor: "hsl(var(--background))",
        }),
    };
}

function DraggableTableHeader<TData>({
                                         header,
                                         onSort,
                                         isHiddenUnderPinned,
                                     }: {
    header: Header<TData, unknown>;
    onSort: (header: Header<TData, unknown>) => void;
    isHiddenUnderPinned?: boolean;
}) {
    const {attributes, isDragging, listeners, setNodeRef, transform} =
        useSortable({
            id: header.column.id,
        });

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: "relative",
        transform: CSS.Translate.toString(transform),
        transition: "width transform 0.2s ease-in-out",
        whiteSpace: "nowrap",
        width: header.column.getSize(),
        ...getCommonPinningStyles(header.column),
    };

    const isPinned = header.column.getIsPinned();

    return (
        <TableHead
            ref={setNodeRef}
            style={{
                ...style,
                ...(isHiddenUnderPinned && {
                    visibility: "hidden" as const,
                    pointerEvents: "none" as const,
                }),
            }}
            className={cn(
                "group relative select-none",
                isDragging && "bg-muted/50",
                isPinned && "overflow-hidden",
            )}
        >
            {isPinned && (
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{ backgroundColor: "hsl(var(--background))" }}
                    aria-hidden
                />
            )}
            {header.isPlaceholder ? null : (
                <div className="relative z-10 flex items-center gap-1">
                    <button
                        type="button"
                        className="touch-none cursor-grab p-0.5 opacity-50 hover:opacity-100 active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                        aria-label="Drag to reorder column"
                    >
                        {header.column.getIsSorted() === false && <GripVertical className="h-4 w-4"/>}
                    </button>
                    <div
                        onClick={() => onSort(header)}
                        className={cn(
                            "flex-1",
                            header.column.getCanSort() && "hover:cursor-pointer",
                        )}
                    >
                        {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                        )}
                        {(header.column.getIsSorted() === "asc" ||
                            header.column.getIsSorted() === "desc") && (
                            <span className="ml-1">
                                {header.column.getIsSorted() === "asc" && "↑"}
                                {header.column.getIsSorted() === "desc" && "↓"}
                            </span>
                        )}
                    </div>
                    {header.column.getCanPin() && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    aria-label="Pin column"
                                >
                                    <Pin className="h-3.5 w-3.5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {header.column.getIsPinned() !== "left" && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            header.column.pin("left")
                                        }
                                    >
                                        <Pin className="mr-2 h-3.5 w-3.5"/>
                                        Pin left
                                    </DropdownMenuItem>
                                )}
                                {header.column.getIsPinned() && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            header.column.pin(false)
                                        }
                                    >
                                        <PinOff className="mr-2 h-3.5 w-3.5"/>
                                        Unpin
                                    </DropdownMenuItem>
                                )}
                                {header.column.getIsPinned() !== "right" && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            header.column.pin("right")
                                        }
                                    >
                                        <Pin className="mr-2 h-3.5 w-3.5"/>
                                        Pin right
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {header.column.getCanResize() && (
                        <div
                            role="separator"
                            aria-label="Resize column"
                            className={cn(
                                "absolute -right-0.5 top-0 z-20 h-full w-1.5 shrink-0 cursor-col-resize select-none border-r border-transparent bg-border/30 hover:border-primary/50 hover:bg-primary/20",
                                header.column.getIsResizing() && "border-primary bg-primary/30",
                            )}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                header.getResizeHandler()(e);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                header.getResizeHandler()(e);
                            }}
                        />
                    )}
                </div>
            )}
        </TableHead>
    );
}

function DragAlongCell<TData>({
    cell,
    isHiddenUnderPinned,
}: {
    cell: Cell<TData, unknown>;
    isHiddenUnderPinned?: boolean;
}) {
    const {isDragging, setNodeRef, transform} = useSortable({
        id: cell.column.id,
    });

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: "relative",
        transform: CSS.Translate.toString(transform),
        transition: "width transform 0.2s ease-in-out",
        width: cell.column.getSize(),
        minWidth: cell.column.getSize(),
        maxWidth: cell.column.getSize(),
        ...getCommonPinningStyles(cell.column),
    };

    const isPinned = cell.column.getIsPinned();

    return (
        <TableCell
            ref={setNodeRef}
            style={{
                ...style,
                ...(isHiddenUnderPinned && {
                    visibility: "hidden" as const,
                    pointerEvents: "none" as const,
                }),
            }}
            className={cn(
                isDragging && "bg-muted/50",
                isPinned && "overflow-hidden",
            )}
        >
            {isPinned && (
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{ backgroundColor: "hsl(var(--background))" }}
                    aria-hidden
                />
            )}
            <div className={cn(isPinned && "relative z-10")}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
        </TableCell>
    );
}

type Props<TData> = {
    table: TableType<TData>;
};

function TanStackBasicTableTableComponentComp<TData>({
                                                                table,
                                                            }: Props<TData>) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({
        scrollLeft: 0,
        viewportWidth: 0,
    });

    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current;
        setScrollState({
            scrollLeft: el?.scrollLeft ?? 0,
            viewportWidth: el?.clientWidth ?? 0,
        });
    }, []);

    useEffect(() => {
        handleScroll();
        const el = scrollContainerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(handleScroll);
        ro.observe(el);
        return () => ro.disconnect();
    }, [handleScroll]);

    const { leftPinnedWidth, rightPinnedWidth, columnStartMap } = useMemo(() => {
        const leftHeaders = table.getLeftHeaderGroups()[0]?.headers ?? [];
        const centerHeaders = table.getCenterHeaderGroups()[0]?.headers ?? [];
        const rightHeaders = table.getRightHeaderGroups()[0]?.headers ?? [];

        const left = leftHeaders.reduce(
            (sum, h) => sum + h.column.getSize(),
            0,
        );
        const right = rightHeaders.reduce(
            (sum, h) => sum + h.column.getSize(),
            0,
        );

        const startMap = new Map<string, number>();
        let pos = left;
        for (const h of centerHeaders) {
            startMap.set(h.column.id, pos);
            pos += h.column.getSize();
        }

        return {
            leftPinnedWidth: left,
            rightPinnedWidth: right,
            columnStartMap: startMap,
        };
    }, [table]);

    const isColumnHiddenUnderPinned = useCallback(
        (
            columnId: string,
            columnStart: number,
            columnWidth: number,
            scrollLeft: number,
            viewportWidth: number,
        ) => {
            const isPinned = table.getColumn(columnId)?.getIsPinned();
            if (isPinned) return false;

            if (leftPinnedWidth > 0) {
                const leftEdgeInViewport = columnStart - scrollLeft;
                if (leftEdgeInViewport < leftPinnedWidth) return true;
            }

            if (rightPinnedWidth > 0 && viewportWidth > 0) {
                const rightEdgeInViewport =
                    columnStart + columnWidth - scrollLeft;
                const rightPinnedStart = viewportWidth - rightPinnedWidth;
                if (rightEdgeInViewport > rightPinnedStart) return true;
            }

            return false;
        },
        [table, leftPinnedWidth, rightPinnedWidth],
    );

    const visibleColumnOrder = table
        .getHeaderGroups()[0]?.headers.filter((h) => h.column.getIsVisible())
        .map((h) => h.column.id) ?? [];

    const sortToggler = (header: Header<TData, unknown>) => {
        if (header.column.getCanSort()) {
            const nextSort = header.column.getNextSortingOrder();
            if (!nextSort) {
                header.column.clearSorting();
            } else {
                header.column.toggleSorting(
                    nextSort?.toString() === "desc",
                    true,
                );
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (active && over && active.id !== over.id) {
            const columnOrder = table.getState().columnOrder;
            const oldIndex = columnOrder.indexOf(active.id as string);
            const newIndex = columnOrder.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                table.setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
            }
        }
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 3 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 8 },
        }),
        useSensor(KeyboardSensor, {}),
    );

    const { scrollLeft, viewportWidth } = scrollState;

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <Table
                containerRef={scrollContainerRef}
                onContainerScroll={handleScroll}
                style={{
                    width: table.getTotalSize(),
                    minWidth: table.getTotalSize(),
                    tableLayout: "fixed",
                    borderCollapse: "separate",
                    borderSpacing: 0,
                }}
            >
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            <SortableContext
                                items={visibleColumnOrder}
                                strategy={horizontalListSortingStrategy}
                            >
                                {headerGroup.headers
                                    .filter((h) => h.column.getIsVisible())
                                    .map((header) => {
                                        const start =
                                            columnStartMap.get(
                                                header.column.id,
                                            ) ?? 0;
                                        const hidden =
                                            isColumnHiddenUnderPinned(
                                                header.column.id,
                                                start,
                                                header.column.getSize(),
                                                scrollLeft,
                                                viewportWidth,
                                            );
                                        return (
                                            <DraggableTableHeader
                                                key={header.id}
                                                header={header}
                                                onSort={sortToggler}
                                                isHiddenUnderPinned={hidden}
                                            />
                                        );
                                    })}
                            </SortableContext>
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={100}>No data found</TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                <SortableContext
                                    items={visibleColumnOrder}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const start =
                                            columnStartMap.get(
                                                cell.column.id,
                                            ) ?? 0;
                                        const hidden =
                                            isColumnHiddenUnderPinned(
                                                cell.column.id,
                                                start,
                                                cell.column.getSize(),
                                                scrollLeft,
                                                viewportWidth,
                                            );
                                        return (
                                            <DragAlongCell
                                                key={cell.id}
                                                cell={cell}
                                                isHiddenUnderPinned={hidden}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </DndContext>
    );
}
export const TanStackBasicTableTableComponent = dynamic(() => Promise.resolve(TanStackBasicTableTableComponentComp), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default TanStackBasicTableTableComponent;