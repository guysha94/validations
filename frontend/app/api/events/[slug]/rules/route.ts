import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {events, rules} from "@/lib/db/schema";
import {eq, or, sql} from "drizzle-orm";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(req: NextRequest, props: Props) {
    const {slug} = await props.params;
    try {
        const eventRules = await db.validations
            .select()
            .from(rules)
            .innerJoin(events, eq(rules.eventId, events.id))
            .where(or(
                eq(events.id, slug),
                eq(sql<string>`LOWER(
                ${events.type}
                )`, slug.toLowerCase())
            ));


        return NextResponse.json(eventRules.flatMap(r => r.rules), {status: 200});
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}

