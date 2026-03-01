import {after, type NextRequest, NextResponse} from "next/server";
import {deleteEvent, getEventById, resolveEventId, updateEvent} from "~/actions/events";
import type {EventWithRules} from "~/domain";
import {
    selectEventRuleSchema,
    selectEventSchema,
    selectRewardRuleSchema,
    selectTeamSchema,
    updateEventSchema
} from "~/lib/validations";
import {z} from "zod";
import {getSession, getTeamSlugById, insertAuditLog} from "~/actions";

export const EventParams = z.object({
    eventId: z.string().describe("ID or type of the event to retrieve or update"),
});

export const EventSearchParams = z.object({
    withRules: z.union([z.boolean(), z.string()]).optional().default(false)
        .transform((value) => {
            if (typeof value === "string") {
                return value.toLowerCase() === "true";
            }
            return value;
        })
        .describe("Whether to include associated event and reward rules in the response"),
    withTeam: z.union([z.boolean(), z.string()]).optional().default(false)
        .transform((value) => {
            if (typeof value === "string") {
                return value.toLowerCase() === "true";
            }
            return value;
        })
        .describe("Whether to include associated team information in the response"),
});

export const GetEventResponse = selectEventSchema.extend({
    event_rules: selectEventRuleSchema.array().optional().nullable(),
    reward_rules: selectRewardRuleSchema.array().optional().nullable(),
    team: selectTeamSchema.optional().nullable(),
})

export const UpdateEventRequest = updateEventSchema;
export const PatchEventRequest = updateEventSchema.partial();
export const UpdateEventResponse = selectEventSchema;
export const DeleteEventResponse = z.object({
    message: z.string().describe("Confirmation message indicating the event was deleted"),
});

type Props = {
    params: Promise<{ eventId: string }>;
};

/**
 * Get Event
 * @description Fetches detailed event information by ID or type.
 * @pathParams EventParams
 * @queryParams EventSearchParams
 * @response GetEventResponse
 * @tag Events
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, {params}: Props) {
    const {eventId} = await params;
    if (!eventId?.length) {
        return NextResponse.json({error: "Invalid event ID"}, {status: 400});
    }

    const searchParams = EventSearchParams.parse(Object.fromEntries(_req.nextUrl.searchParams.entries()));

    const {data, error} = await getEventById(eventId, searchParams);
    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
    if (!data) {
        return NextResponse.json({error: "Event not found"}, {status: 404});
    }
    return NextResponse.json(data, {status: 200});
}

/**
 * Update Event
 * @description Updates event information by ID or type. Accepts event details in the request body and returns the updated event.
 * @pathParams EventParams
 * @body UpdateEventRequest
 * @response UpdateEventResponse
 * @tag Events
 * @method PUT
 * @openapi
 */

export async function PUT(req: NextRequest, {params}: Props) {

    const session = await getSession();
    if (!session) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const {eventId} = await params;
    if (!eventId?.length) {
        return NextResponse.json({error: "Invalid event ID"}, {status: 400});
    }
    let data: EventWithRules;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json(
            {error: "Invalid request body"},
            {status: 400},
        );
    }
    const {error} = await updateEvent(eventId, {
        type: data.type as string,
        label: data.label as string,
        icon: data.icon as string,
        eventSchema: data.eventSchema as Record<string, unknown> | undefined,
        editAccess: data.editAccess,
        createdById: data.createdById,
    });
    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
    const {data: updated, error: updatedError} = await getEventById(eventId, {withTeam: true});
    if (updatedError) {
        return NextResponse.json({error: updatedError.message}, {status: 500});
    }
    if (!updated) {
        return NextResponse.json({error: "Event not found after update"}, {status: 404});
    }
    after(async () => {

        await insertAuditLog({
            teamSlug: (updated as any).team?.slug || "unknown",
            action: "update",
            entityType: "event",
            entityId: eventId,
            actorId: session.user.id,
            payload: {
                before: data,
                after: updated,
            },
        })
    })
    return NextResponse.json(updated, {status: 200});
}

/**
 * Partial Update Event
 * @description Partially updates event information by ID or type. Accepts only the fields to change in the request body.
 * @pathParams EventParams
 * @body PatchEventRequest
 * @response UpdateEventResponse
 * @tag Events
 * @method PATCH
 * @openapi
 */
export async function PATCH(req: NextRequest, {params}: Props) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const {eventId} = await params;
    if (!eventId?.length) {
        return NextResponse.json({error: "Invalid event ID"}, {status: 400});
    }
    const resolvedId = await resolveEventId(eventId);
    if (!resolvedId) {
        return NextResponse.json({error: "Event not found"}, {status: 404});
    }
    let data: z.infer<typeof PatchEventRequest>;
    try {
        data = PatchEventRequest.parse(await req.json());
    } catch {
        return NextResponse.json({error: "Invalid request body"}, {status: 400});
    }
    const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
    ) as z.infer<typeof updateEventSchema>;
    if (Object.keys(payload).length === 0) {
        const {data: current, error: fetchError} = await getEventById(eventId);
        if (fetchError || !current) {
            return NextResponse.json({error: "Event not found"}, {status: 404});
        }
        return NextResponse.json(current, {status: 200});
    }
    const {error} = await updateEvent(resolvedId, payload);
    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
    const {data: updated, error: updatedError} = await getEventById(eventId);
    if (updatedError) {
        return NextResponse.json({error: updatedError.message}, {status: 500});
    }
    if (!updated) {
        return NextResponse.json({error: "Event not found after update"}, {status: 404});
    }
    after(async () => {

        await insertAuditLog({
            teamSlug: (updated as any).team?.slug || "unknown",
            action: "update",
            entityType: "event",
            entityId: eventId,
            actorId: session.user.id,
            payload: {
                update: payload || {} as any,
                after: updated,
            },
        })
    })
    return NextResponse.json(updated, {status: 200});
}

/**
 * Delete Event
 * @description Deletes an event by ID or type. Returns a confirmation message upon successful deletion.
 * @pathParams EventParams
 * @response DeleteEventResponse
 * @tag Events
 * @method DELETE
 * @openapi
 */
export async function DELETE(req: NextRequest, {params}: Props) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const {eventId} = await params;
    if (!eventId?.length) {
        return NextResponse.json({error: "Invalid event ID"}, {status: 400});
    }
    const {error} = await deleteEvent(eventId);
    if (error) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
    let teamSlug = "unknown";
    if (!!session.session.activeTeamId) {
        const {data} = await getTeamSlugById(session.session.activeTeamId);
        teamSlug = data || "unknown";
    }
    after(async () => {
        await insertAuditLog({
            teamSlug,
            action: "delete",
            entityType: "event",
            entityId: eventId,
            actorId: session.user.id,
            payload: {
                before: {
                    id: eventId,
                },
                after: null,
            } as any,
        })
    })
    return NextResponse.json({message: "event deleted"}, {status: 200});
}