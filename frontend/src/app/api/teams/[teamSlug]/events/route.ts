import {after, type NextRequest, NextResponse} from "next/server";
import {createEvent, getEventById, getEventsWithRulesByTeamSlug, getSession, insertAuditLog} from "~/actions";
import {getTeamBySlug} from "~/actions/auth/teams";
import {
    createEventSchema,
    selectEventSchema,
    selectEventRuleSchema,
    selectRewardRuleSchema,
} from "~/lib/validations";
import {z} from "zod";

export const TeamEventsPathParams = z.object({
    teamSlug: z.string().describe("Team slug or ID to fetch events for"),
});

export const GetTeamEventsResponse = z.array(
    selectEventSchema.extend({
        eventRules: selectEventRuleSchema.array().optional().nullable(),
        rewardRules: selectRewardRuleSchema.array().optional().nullable(),
    }),
);

export const CreateEventRequest = createEventSchema;
export const CreateEventResponse = selectEventSchema;

type Props = {
    params: Promise<{ teamSlug: string }>;
};

/**
 * Get Team Events
 * @description Fetches all events with their event and reward rules for a team by slug or ID.
 * @pathParams TeamEventsPathParams
 * @response GetTeamEventsResponse
 * @tag Events
 * @method GET
 * @openapi
 */
export async function GET(_req: NextRequest, {params}: Props) {
    const {teamSlug} = await params;

    const {data, error} = await getEventsWithRulesByTeamSlug(teamSlug);

    if (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("Failed to fetch events:", error);
        }
        return NextResponse.json({error: String(error)}, {status: 500});
    }

    return NextResponse.json(data);
}

/**
 * Create Event
 * @description Creates a new event for a team. Accepts event details in the request body and returns the created event. Team is derived from path.
 * @pathParams TeamEventsPathParams
 * @body CreateEventRequest
 * @response CreateEventResponse
 * @tag Events
 * @method POST
 * @openapi
 */
export async function POST(req: NextRequest, {params}: Props) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const {teamSlug} = await params;
    const {data: team, error: teamError} = await getTeamBySlug(teamSlug);
    if (teamError || !team) {
        return NextResponse.json({error: "Team not found"}, {status: 404});
    }
    const data = await req.json();
    const validationResult = await createEventSchema.safeParseAsync({
        ...data,
        teamId: team.id,
    });

    if (!validationResult.success) {
        return NextResponse.json(validationResult.error, {status: 400});
    }

    const {data: createdId, error} = await createEvent(validationResult.data);

    if (error) {
        if (process.env.NODE_ENV === "development") {
            console.error("Failed to create event:", error);
        }
        return NextResponse.json({error: String(error)}, {status: 500});
    }
    if (!createdId) return NextResponse.json({message: "created"}, {status: 201});

    const {data: created} = await getEventById(createdId);
    after(async () => {

        await insertAuditLog({
            teamSlug,
            action: "create",
            entityType: "event",
            entityId: createdId,
            actorId: session.user.id,
            payload: {
                before: null,
                after: created || {},
            }
        })
    })
    return NextResponse.json(created || {message: "created"}, {status: 201});

}