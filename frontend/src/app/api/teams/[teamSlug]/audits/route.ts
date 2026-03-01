import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchAuditLogs } from "~/actions/audits";
import type { PaginationAndSorting, SortingState } from "~/domain";

type Props = {
  params: Promise<{ teamSlug: string }>;
};

function parseSorting(s: string | null): SortingState {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest, { params }: Props) {
  const { teamSlug } = await params;
  const { searchParams } = new URL(req.url);

  const pageIndex = parseInt(searchParams.get("pageIndex") ?? "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const q = searchParams.get("q") ?? "";
  const sorting = parseSorting(searchParams.get("sorting"));

  const options: PaginationAndSorting = {
    pageIndex,
    pageSize,
    sorting,
    q,
  };

  const { data, error } = await fetchAuditLogs(teamSlug, options);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch audit logs:", error);
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json(data ?? { total: 0, rows: [] });
}
