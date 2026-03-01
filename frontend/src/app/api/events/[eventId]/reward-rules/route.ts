import { after, type NextRequest, NextResponse } from "next/server";
import { getEventById, resolveEventId } from "~/actions/events";
import { getSession, insertAuditLog } from "~/actions";
import {
  createRewardRule,
  deleteManyRewardRules,
  getRewardRulesByEventId,
  upsertRewardRules,
} from "~/actions/rules";
import { selectRewardRuleSchema } from "~/lib/validations";
import type { RewardRule } from "~/domain";
import { z } from "zod";

export const RewardRulesPathParams = z.object({
  eventId: z.string().describe("ID or type of the event"),
});

const RewardRuleQueryItem = z.object({
  query: z.string(),
  errorMessage: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

const RewardRuleInput = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    enabled: z.boolean().optional().default(true),
    editAccess: z.string().optional(),
    tab: z.string().optional(),
    column: z.string().optional(),
    queries: z
      .array(z.union([z.string(), RewardRuleQueryItem]))
      .optional()
      .default([]),
  })
  .passthrough();

export const UpsertRewardRulesRequest = z.object({
  rules: z.array(RewardRuleInput).describe("Reward rules to upsert"),
  deletedIds: z.array(z.string()).optional().default([]).describe("IDs of rules to delete"),
});

export const UpsertRewardRulesResponse = z.object({
  success: z.literal(true).describe("Indicates the operation completed successfully"),
});

export const ListRewardRulesResponse = z.array(selectRewardRuleSchema);

const CreateRewardRuleRequest = z.object({
  name: z.string(),
  enabled: z.boolean().optional().default(true),
  editAccess: z.string().optional(),
  tab: z.string().optional(),
  column: z.string().optional(),
  queries: z
    .array(z.union([z.string(), RewardRuleQueryItem]))
    .optional()
    .default([]),
});

type Props = {
  params: Promise<{ eventId: string }>;
};

/**
 * List Reward Rules
 * @description Fetches all reward rules for an event by ID or type.
 * @pathParams RewardRulesPathParams
 * @response ListRewardRulesResponse
 * @tag Reward Rules
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  const { data, error } = await getRewardRulesByEventId(eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(data, { status: 200 });
}

/**
 * Create Reward Rule
 * @description Creates a new reward rule for an event. Event ID is derived from the path.
 * @pathParams RewardRulesPathParams
 * @body CreateRewardRuleRequest
 * @response selectRewardRuleSchema
 * @tag Reward Rules
 * @method POST
 * @openapi
 */
export async function POST(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  const resolvedId = await resolveEventId(eventId);
  if (!resolvedId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  let body: z.infer<typeof CreateRewardRuleRequest>;
  try {
    body = CreateRewardRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { data, error } = await createRewardRule({
    eventId: resolvedId,
    name: body.name,
    enabled: body.enabled,
    editAccess: body.editAccess ?? "restricted",
    queries: body.queries.map((q) =>
      typeof q === "string"
        ? { query: q, errorMessage: "", description: "" }
        : {
            query: q.query,
            errorMessage: q.errorMessage ?? "",
            description: q.description ?? "",
          },
    ),
    tab: body.tab ?? "",
    column: body.column ?? "",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "create",
      entityType: "reward_rule",
      entityId: data?.id ?? null,
      actorId: session.user.id,
      payload: { before: null, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 201 });
}

/**
 * Upsert Reward Rules
 * @description Creates or updates reward rules for an event. Accepts an array of rules and optional deletedIds to remove rules. Rules are upserted and deleted in parallel.
 * @pathParams RewardRulesPathParams
 * @body UpsertRewardRulesRequest
 * @response UpsertRewardRulesResponse
 * @tag Reward Rules
 * @method PUT
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  let body: z.infer<typeof UpsertRewardRulesRequest>;
  try {
    body = UpsertRewardRulesRequest.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const resolvedId = await resolveEventId(eventId);
  if (!resolvedId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const { rules, deletedIds } = body;
  const toUpsert: (RewardRule & { eventId: string; updatedAt: Date })[] = rules.map((r) => ({
    ...r,
    id: r.id ?? "",
    eventId: resolvedId,
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
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "reward_rule",
      entityId: eventId,
      actorId: session.user.id,
      payload: { rules: toUpsert, deletedIds },
    });
  });
  return NextResponse.json({ success: true });
}
