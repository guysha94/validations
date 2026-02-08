import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {events} from "@/lib/db/schema";
import {eq, or, sql} from "drizzle-orm";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(req: NextRequest, props: Props) {

    const {slug} = await props.params;

    try {

        const event = await db.validations
            .query.events
            .findFirst({
                where: or(
                    eq(events.id, slug),
                    eq(sql<string>`LOWER(
                    ${events.type}
                    )`, slug.toLowerCase())
                )
            })


        return NextResponse.json(event, {status: 200});
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}

export async function PUT(req: NextRequest, props: Props) {
    const {slug} = await props.params;
    const data = await req.json();
    const orClause = or(
        eq(events.id, slug),
        eq(sql<string>`LOWER(
        ${events.type}
        )`, slug.toLowerCase())
    );
    delete data.id; // Prevent updating the ID
    console.log("Updating event with slug:", slug, "Data:", data);
    try {
        const updatedEvent = await db.validations
            .update(events)
            .set(data)
            .where(orClause);
        if (!updatedEvent?.[0]?.affectedRows) {
            return NextResponse.json({error: "Failed to update event"}, {status: 500});
        }
        const updatedEventData = await db.validations
            .query.events
            .findFirst({
                where: orClause
            });
        return NextResponse.json(updatedEventData, {status: 200});
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({error: "Failed to update event"}, {status: 500});
    }

}