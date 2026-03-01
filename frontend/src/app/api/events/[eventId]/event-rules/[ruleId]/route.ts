import { after, type NextRequest, NextResponse } from "next/server";
import { getEventById } from "~/actions/events";
import { getSession, insertAuditLog } from "~/actions";
import {
  deleteEventRule,
  getEventRuleById,
  updateEventRule,
} from "~/actions/rules";
import { selectEventRuleSchema, updateEventRuleSchema } from "~/lib/validations";
import { z } from "zod";

export const EventRulePathParams = z.object({
  eventId: z.string().describe("ID or type of the event"),
  ruleId: z.string().describe("ID of the event rule"),
});

export const UpdateEventRuleRequest = updateEventRuleSchema;
export const PatchEventRuleRequest = updateEventRuleSchema.partial();
export const UpdateEventRuleResponse = selectEventRuleSchema;
export const DeleteEventRuleResponse = z.object({
  message: z.string().describe("Confirmation message"),
});

type Props = {
  params: Promise<{ eventId: string; ruleId: string }>;
};

/**
 * Get Event Rule
 * @description Fetches a single event rule by ID for an event.
 * @pathParams EventRulePathParams
 * @response UpdateEventRuleResponse
 * @tag Event Rules
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { eventId, ruleId } = await params;
  if (!eventId?.length || !ruleId?.length) {
    return NextResponse.json({ error: "Invalid event or rule ID" }, { status: 400 });
  }
  const { data, error } = await getEventRuleById(eventId, ruleId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event rule not found" }, { status: 404 });
  }
  return NextResponse.json(data, { status: 200 });
}

/**
 * Update Event Rule
 * @description Updates an event rule by ID. Accepts partial event rule fields in the request body.
 * @pathParams EventRulePathParams
 * @body UpdateEventRuleRequest
 * @response UpdateEventRuleResponse
 * @tag Event Rules
 * @method PUT
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { eventId, ruleId } = await params;
  if (!eventId?.length || !ruleId?.length) {
    return NextResponse.json({ error: "Invalid event or rule ID" }, { status: 400 });
  }
  const { data: existing, error: fetchError } = await getEventRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Event rule not found" },
      { status: 404 },
    );
  }
  let body: z.infer<typeof UpdateEventRuleRequest>;
  try {
    body = UpdateEventRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  ) as Partial<z.infer<typeof UpdateEventRuleRequest>>;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing, { status: 200 });
  }
  const { data, error } = await updateEventRule(ruleId, payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "event_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { before: existing, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 200 });
}

/**
 * Partial Update Event Rule
 * @description Partially updates an event rule by ID. Accepts only the fields to change in the request body.
 * @pathParams EventRulePathParams
 * @body PatchEventRuleRequest
 * @response UpdateEventRuleResponse
 * @tag Event Rules
 * @method PATCH
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { eventId, ruleId } = await params;
  if (!eventId?.length || !ruleId?.length) {
    return NextResponse.json({ error: "Invalid event or rule ID" }, { status: 400 });
  }
  const { data: existing, error: fetchError } = await getEventRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Event rule not found" },
      { status: 404 },
    );
  }
  let body: z.infer<typeof PatchEventRuleRequest>;
  try {
    body = PatchEventRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  ) as Partial<z.infer<typeof UpdateEventRuleRequest>>;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing, { status: 200 });
  }
  const { data, error } = await updateEventRule(ruleId, payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "event_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { update: payload, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 200 });
}

/**
 * Delete Event Rule
 * @description Deletes an event rule by ID.
 * @pathParams EventRulePathParams
 * @response DeleteEventRuleResponse
 * @tag Event Rules
 * @method DELETE
 * @openapi
 */
export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { eventId, ruleId } = await params;
  if (!eventId?.length || !ruleId?.length) {
    return NextResponse.json({ error: "Invalid event or rule ID" }, { status: 400 });
  }
  const { data: existing, error: fetchError } = await getEventRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Event rule not found" },
      { status: 404 },
    );
  }
  const { error } = await deleteEventRule(ruleId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "delete",
      entityType: "event_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { before: existing, after: null },
    });
  });
  return NextResponse.json({ message: "Event rule deleted" }, { status: 200 });
}
