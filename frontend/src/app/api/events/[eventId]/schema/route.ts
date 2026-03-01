import { after, type NextRequest, NextResponse } from "next/server";
import { getEventById, updateEventSchema } from "~/actions/events";
import { getSession, insertAuditLog } from "~/actions";
import { z } from "zod";

export const EventSchemaPathParams = z.object({
  eventId: z.string().describe("ID or type of the event"),
});

export const UpdateEventSchemaRequest = z
  .record(z.string(), z.unknown())
  .describe("Event schema defining tabs and columns expected in the Google Sheet");

export const UpdateEventSchemaResponse = z.object({
  success: z.literal(true).describe("Indicates the schema was updated successfully"),
});

type Props = {
  params: Promise<{ eventId: string }>;
};

/**
 * Update Event Schema
 * @description Updates the event schema (tabs and columns) for an event. The schema defines the expected structure of the Google Sheet for validation.
 * @pathParams EventSchemaPathParams
 * @body UpdateEventSchemaRequest
 * @response UpdateEventSchemaResponse
 * @tag Events
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

  const data = await req.json();
  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { data: existing } = await getEventById(eventId);
  const beforeSchema = (existing as { eventSchema?: unknown })?.eventSchema ?? null;

  const { error } = await updateEventSchema(eventId, data);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: eventWithTeam } = await getEventById(eventId, { withTeam: true });
  const teamSlug = (eventWithTeam as { team?: { slug?: string } })?.team?.slug ?? "unknown";
  after(async () => {
    await insertAuditLog({
      teamSlug,
      action: "update",
      entityType: "event",
      entityId: eventId,
      actorId: session.user.id,
      payload: { schema: { before: beforeSchema, after: data } },
    });
  });
  return NextResponse.json({ success: true });
}
