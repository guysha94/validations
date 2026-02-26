import { Suspense } from "react";
import { fetchAuditLogs } from "~/actions";
import { ProtectedPage } from "~/components/auth";
import Loader from "~/components/Loader";
import { AuditsTable } from "~/components/tables";
import type { PaginationAndSorting } from "~/domain";

type Props = {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<PaginationAndSorting>;
};

async function AuditsPageInner(props: Props) {
  const { teamSlug } = await props.params;
  const paginationAndSorting = await props.searchParams;
  if (paginationAndSorting) {
    paginationAndSorting.pageIndex = parseInt(
      (paginationAndSorting.pageIndex || "0").toString(),
      10,
    );
    paginationAndSorting.pageSize = parseInt(
      (paginationAndSorting.pageSize || "10").toString(),
      10,
    );
  }

  const [logs, err] = await fetchAuditLogs(
      teamSlug,
    paginationAndSorting,
  );

  if (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching audit logs:", err);
    }
    return (
      <ProtectedPage>
        <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
          <div className="w-full max-w-6xl">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-red-500">
              Failed to load audit logs
            </h4>
            <p className="leading-7 [&:not(:first-child)]:mt-6 text-red-500">
              An error occurred while fetching the audit logs. Please try again
              later.
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

export default function AuditsPage(props: Props) {
  return (
    <Suspense fallback={<Loader fullscreen />}>
      <AuditsPageInner {...props} />
    </Suspense>
  );
}
