import { fetchAuditLogs } from "~/lib/db/crud";
import { ProtectedPage } from "~/components/auth";
import { AuditsTable } from "~/components/tables/AuditsTable";
import { PaginationAndSorting } from "~/domain";


type Props = {
    params: Promise<{ teamSlug: string; }>;
    searchParams: Promise<PaginationAndSorting>
}


export default async function AuditsPage(props: Props) {

    const { teamSlug } = await props.params;
    const paginationAndSorting = await props.searchParams;
    if (!!paginationAndSorting) {
        paginationAndSorting.pageIndex = parseInt((paginationAndSorting.pageIndex || "0").toString(), 10);
        paginationAndSorting.pageSize = parseInt((paginationAndSorting.pageSize || "10").toString(), 10);
    }


    const [logs, err] = await fetchAuditLogs("dice-server-team", paginationAndSorting);

    if (err) {
        console.log("Error fetching audit logs:", err);
        return (
            <ProtectedPage>
                <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
                    <div className="w-full max-w-6xl">
                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-red-500">
                            Failed to load audit logs
                        </h4>
                        <p className="leading-7 [&:not(:first-child)]:mt-6 text-red-500">
                            An error occurred while fetching the audit logs. Please try again later.
                        </p>
                    </div>
                </div>
            </ProtectedPage>
        );
    }


    return (
        <ProtectedPage>
            <div className="flex min-h-screen justify-center bg-background py-12 px-4">
                <div className="w-full max-w-6xl">
                    <AuditsTable
                        data={logs.rows}
                        rowCount={logs.total}
                        paginationAndSorting={paginationAndSorting}
                        teamSlug={teamSlug}
                    />
                </div>
            </div>
        </ProtectedPage>
    );
}
