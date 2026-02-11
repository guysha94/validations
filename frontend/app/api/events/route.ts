import {type NextRequest, NextResponse} from "next/server";
import {headers} from "next/headers";
import {db} from "@/lib/db";
import {auth} from "~/lib/auth/server";
import {uuidv7} from "~/lib/utils";
import {eventPermissions, events} from "~/lib/db/schema";
import {fetchAllEvents} from "~/lib/db/crud";

export async function GET(req: NextRequest) {
    const [eventsList, error] = await fetchAllEvents();
    return !!error
        ? NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
        : NextResponse.json(eventsList, { status: 200 });
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const activeTeamId = session.session?.activeTeamId ?? null;
    if (!activeTeamId) {
        return NextResponse.json(
            { error: "No active team. Switch to a team first." },
            { status: 400 }
        );
    }

    const data = await req.json();
    const payload = Array.isArray(data) ? data : [data];
    const editAccessDefault = "restricted";

    try {
        const created: unknown[] = [];
        for (const e of payload) {
            const editAccess =
                e.editAccess === "public" || e.editAccess === "restricted"
                    ? e.editAccess
                    : editAccessDefault;
            const eventId = uuidv7();
            const values = {
                id: eventId,
                teamId: activeTeamId,
                createdById: session.user.id,
                editAccess,
                type: e.type,
                label: e.label ?? e.title ?? e.type,
                icon: e.icon ?? "FileQuestion",
                eventSchema: e.eventSchema ?? {},
                updatedAt: new Date(),
            };
            await db.validations.insert(events).values(values as any);
            await db.validations.insert(eventPermissions).values({
                eventId,
                userId: session.user.id,
                role: "owner",
            });
            const [row] = await db.validations
                .query.events.findMany({ where: (t, { eq }) => eq(t.id, eventId) });
            if (row) created.push(row);
        }
        const results = created.length > 1 ? created : created[0] ?? null;
        return NextResponse.json(results, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}