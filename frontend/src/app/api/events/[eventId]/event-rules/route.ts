import { after, type NextRequest, NextResponse } from "next/server";
import { getEventById, resolveEventId } from "~/actions/events";
import { getSession, insertAuditLog } from "~/actions";
import { deleteManyEventRules, getEventRulesByEventId, upsertEventRules } from "~/actions/rules";
import type { EventRule } from "~/domain";
import { selectEventRuleSchema } from "~/lib/validations";
import { z } from "zod";

export const EventRulesPathParams = z.object({
  eventId: z.string().describe("ID or type of the event"),
});

const EventRuleInput = selectEventRuleSchema.omit({ eventId: true }).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpsertEventRulesRequest = z.object({
  rules: z.array(EventRuleInput).describe("Event rules to upsert"),
  deletedIds: z.array(z.string()).optional().default([]).describe("IDs of rules to delete"),
});

export const UpsertEventRulesResponse = z.object({
  success: z.literal(true).describe("Indicates the operation completed successfully"),
});

export const ListEventRulesResponse = z.array(selectEventRuleSchema);

const CreateEventRuleRequest = selectEventRuleSchema.omit({
  id: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
});

type Props = {
  params: Promise<{ eventId: string }>;
};

/**
 * List Event Rules
 * @description Fetches all event rules for an event by ID or type.
 * @pathParams EventRulesPathParams
 * @response ListEventRulesResponse
 * @tag Event Rules
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  const { data, error } = await getEventRulesByEventId(eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(data, { status: 200 });
}

/**
 * Create Event Rule
 * @description Creates a new event rule for an event. Event ID is derived from the path; do not include it in the body.
 * @pathParams EventRulesPathParams
 * @body CreateEventRuleRequest
 * @response selectEventRuleSchema
 * @tag Event Rules
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
  let body: z.infer<typeof CreateEventRuleRequest>;
  try {
    body = CreateEventRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { createEventRule } = await import("~/actions/rules");
  const { data, error } = await createEventRule({
    eventId: resolvedId,
    name: body.name,
    description: body.description ?? null,
    errorMessage: body.errorMessage,
    query: body.query ?? "",
    enabled: body.enabled ?? true,
    editAccess: body.editAccess ?? "restricted",
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
      entityType: "event_rule",
      entityId: data?.id ?? null,
      actorId: session.user.id,
      payload: { before: null, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 201 });
}

/**
 * Upsert Event Rules
 * @description Creates or updates event rules for an event. Accepts an array of rules and optional deletedIds to remove rules. Rules are upserted and deleted in parallel.
 * @pathParams EventRulesPathParams
 * @body UpsertEventRulesRequest
 * @response UpsertEventRulesResponse
 * @tag Event Rules
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

  let body: z.infer<typeof UpsertEventRulesRequest>;
  try {
    body = UpsertEventRulesRequest.parse(await req.json());
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
  const toUpsert: (EventRule & { eventId: string; updatedAt: Date })[] = rules.map((r) => ({
    ...r,
    id: r.id ?? "",
    eventId: resolvedId,
    updatedAt: new Date(),
  }));

  const [{ error: upsertError }, { error: deleteError }] = await Promise.all([
    upsertEventRules(toUpsert),
    deletedIds.length > 0
      ? deleteManyEventRules(deletedIds)
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
      entityType: "event_rule",
      entityId: eventId,
      actorId: session.user.id,
      payload: { rules: toUpsert, deletedIds },
    });
  });
  return NextResponse.json({ success: true });
}
