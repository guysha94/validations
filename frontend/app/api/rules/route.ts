import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "~/lib/auth/server";
import { canEditEvent } from "~/lib/db/crud";
import { rules } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

export async function GET(req: NextRequest) {
    try {
        const allRules = await db.validations.query.rules.findMany();
        return NextResponse.json(allRules, { status: 200 });
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const payload = Array.isArray(data) ? data : [data];
    const firstEventId = payload[0]?.eventId;
    if (!firstEventId) {
        return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const allowed = await canEditEvent(firstEventId, session.user.id);
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newRules = payload.map((rule: Record<string, unknown>) => ({
        ...rule,
        id: uuidv7(),
        updatedAt: new Date(),
    }));

    try {
        const newRuleIds = await db.validations.insert(rules).values(newRules).$returningId();
        if (!newRuleIds?.length) {
            return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
        }
        const newRule = await db.validations.query.rules.findFirst({
            where: eq(rules.id, (newRuleIds[0] as { id: string }).id),
        });
        return NextResponse.json(newRule, { status: 201 });
    } catch (error) {
        console.error("Error creating rule:", error);
        return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
    }
}