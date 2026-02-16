import {flexRender, Header, Table as TableType} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "~/components/ui/table";

type Props<TData> = {
    table: TableType<TData>;
}

export default function TanStackBasicTableTableComponent<TData>({table,}: Props<TData>) {
    const sortToggler = (header: Header<TData, unknown>) => {
        if (header.column.getCanSort()) {
            header.column.toggleSorting(undefined, true);
        }
    };

    return (
        <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                {table.getHeaderGroups().map((header) => (
                    <TableRow key={header.id}>
                        {header.headers.map((header) => (
                            <TableHead key={header.id}>
                                {header.isPlaceholder ? null : (
                                    <div
                                        onClick={() => sortToggler(header)}
                                        className="hover:cursor-pointer"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {(header.column.getIsSorted() === "asc" ||
                                            header.column.getIsSorted() === "desc") && (
                                            <span>
                        {header.column.getIsSorted() === "asc" && "↑"}
                                                {header.column.getIsSorted() === "desc" && "↓"}
                      </span>
                                        )}
                                    </div>
                                )}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody >
                {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={100}>No data found</TableCell>
                    </TableRow>
                ) : (
                    <>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </>
                )}
            </TableBody>
        </Table>
    );
}