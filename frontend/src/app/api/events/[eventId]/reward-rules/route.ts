import { type NextRequest, NextResponse } from "next/server";
import { deleteManyRewardRules, upsertRewardRules } from "~/actions/rules";
import type { RewardRule } from "~/domain";

type Props = {
  params: Promise<{ eventId: string }>;
};

type Body = {
  rules: RewardRule[];
  deletedIds?: string[];
};

export async function PUT(req: NextRequest, { params }: Props) {
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { rules = [], deletedIds = [] } = body;
  if (!Array.isArray(rules)) {
    return NextResponse.json(
      { error: "rules must be an array" },
      { status: 400 },
    );
  }

  const toUpsert = rules.map((r) => ({
    ...r,
    eventId,
    queries: Array.isArray(r.queries)
      ? r.queries.map((q) =>
          typeof q === "string"
            ? { query: q, errorMessage: "", description: "" }
            : {
                query: String(q?.query ?? ""),
                errorMessage: String(q?.errorMessage ?? ""),
                description: q?.description ?? "",
              },
        )
      : [],
    updatedAt: new Date(),
  }));

  const [{ error: upsertError }, { error: deleteError }] = await Promise.all([
    upsertRewardRules(toUpsert),
    deletedIds.length > 0
      ? deleteManyRewardRules(deletedIds)
      : Promise.resolve({ data: undefined, error: undefined }),
  ]);

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
