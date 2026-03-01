import { after, type NextRequest, NextResponse } from "next/server";
import { getEventById } from "~/actions/events";
import { getSession, insertAuditLog } from "~/actions";
import {
  deleteRewardRule,
  getRewardRuleById,
  updateRewardRule,
} from "~/actions/rules";
import { selectRewardRuleSchema, updateRewardRuleSchema } from "~/lib/validations";
import { z } from "zod";

export const RewardRulePathParams = z.object({
  eventId: z.string().describe("ID or type of the event"),
  ruleId: z.string().describe("ID of the reward rule"),
});

export const UpdateRewardRuleRequest = updateRewardRuleSchema;
export const PatchRewardRuleRequest = updateRewardRuleSchema.partial();
export const UpdateRewardRuleResponse = selectRewardRuleSchema;
export const DeleteRewardRuleResponse = z.object({
  message: z.string().describe("Confirmation message"),
});

type Props = {
  params: Promise<{ eventId: string; ruleId: string }>;
};

/**
 * Get Reward Rule
 * @description Fetches a single reward rule by ID for an event.
 * @pathParams RewardRulePathParams
 * @response UpdateRewardRuleResponse
 * @tag Reward Rules
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { eventId, ruleId } = await params;
  if (!eventId?.length || !ruleId?.length) {
    return NextResponse.json({ error: "Invalid event or rule ID" }, { status: 400 });
  }
  const { data, error } = await getRewardRuleById(eventId, ruleId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Reward rule not found" }, { status: 404 });
  }
  return NextResponse.json(data, { status: 200 });
}

/**
 * Update Reward Rule
 * @description Updates a reward rule by ID. Accepts partial reward rule fields in the request body.
 * @pathParams RewardRulePathParams
 * @body UpdateRewardRuleRequest
 * @response UpdateRewardRuleResponse
 * @tag Reward Rules
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
  const { data: existing, error: fetchError } = await getRewardRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Reward rule not found" },
      { status: 404 },
    );
  }
  let body: z.infer<typeof UpdateRewardRuleRequest>;
  try {
    body = UpdateRewardRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing, { status: 200 });
  }
  const { data, error } = await updateRewardRule(ruleId, payload as any);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "reward_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { before: existing, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 200 });
}

/**
 * Partial Update Reward Rule
 * @description Partially updates a reward rule by ID. Accepts only the fields to change in the request body.
 * @pathParams RewardRulePathParams
 * @body PatchRewardRuleRequest
 * @response UpdateRewardRuleResponse
 * @tag Reward Rules
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
  const { data: existing, error: fetchError } = await getRewardRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Reward rule not found" },
      { status: 404 },
    );
  }
  let body: z.infer<typeof PatchRewardRuleRequest>;
  try {
    body = PatchRewardRuleRequest.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing, { status: 200 });
  }
  const { data, error } = await updateRewardRule(ruleId, payload as any);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "reward_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { update: payload, after: data ?? {} },
    });
  });
  return NextResponse.json(data, { status: 200 });
}

/**
 * Delete Reward Rule
 * @description Deletes a reward rule by ID.
 * @pathParams RewardRulePathParams
 * @response DeleteRewardRuleResponse
 * @tag Reward Rules
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
  const { data: existing, error: fetchError } = await getRewardRuleById(eventId, ruleId);
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Reward rule not found" },
      { status: 404 },
    );
  }
  const { error } = await deleteRewardRule(ruleId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "delete",
      entityType: "reward_rule",
      entityId: ruleId,
      actorId: session.user.id,
      payload: { before: existing, after: null },
    });
  });
  return NextResponse.json({ message: "Reward rule deleted" }, { status: 200 });
}
