import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {uuidv7} from "~/lib/utils";
import {events} from "~/lib/db/schema";
import {inArray} from "drizzle-orm";


export async function GET(req: NextRequest) {

    try {

        const event = await db.validations
            .query.events
            .findMany();
        return NextResponse.json(event, {status: 200});
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}


export async function POST(req: NextRequest, res: NextResponse) {
    const data = await req.json();
    const newEvents = (Array.isArray(data) ? data : [data]).map((e) => ({
        ...e,
        id: uuidv7(),
        updatedAt: new Date()
    }));

    try {
        const newEventIds = await db.validations
            .insert(events)
            .values(newEvents)
            .$returningId();
        if (!newEventIds?.length) {
            return NextResponse.json({error: "Failed to create event"}, {status: 500});
        }
        const created = await db.validations
            .query.events.findMany({
                where: inArray(events.id, newEventIds.map((id) => (id as any).id))
            });

        const results = created?.length > 1 ? created : created?.[0] || null;
        return NextResponse.json(results, {status: 201});
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({error: "Failed to create event"}, {status: 500});
    }
}