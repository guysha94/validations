import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {canEditEvent, insertAuditLog} from "~/lib/db/crud";
import {rules} from "~/lib/db/schema";
import {eq, inArray, sql} from "drizzle-orm";
import {uuidv7} from "uuidv7";
import {getUser} from "~/lib/actions";
import {InsertRule} from "~/domain";

export async function GET(req: NextRequest) {
    try {
        const allRules = await db.validations.query.rules.findMany();
        return NextResponse.json(allRules, {status: 200});
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    const user = await getUser();
    if (!user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const data = await req.json();
    const payload = Array.isArray(data) ? data : [data];
    const firstEventId = payload[0]?.eventId;
    if (!firstEventId) {
        return NextResponse.json({error: "eventId required"}, {status: 400});
    }

    const allowed = await canEditEvent(firstEventId, user.id);
    if (!allowed) {
        return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const newRules = payload.map((rule: Record<string, unknown>) => ({
        ...rule,
        id: uuidv7(),
        updatedAt: new Date(),
    }));

    try {
        console.log("Creating rules:", newRules);
        const newRuleIds = await db.validations.insert(rules).values(newRules as any)
            .onDuplicateKeyUpdate({
                set: {
                    id: sql.raw("id"),
                    // update in case of duplicate id, though this should not happen on create
                    name: sql.raw("VALUES(name)"),
                    errorMessage: sql.raw("VALUES(error_message)"),
                    query: sql.raw("VALUES(query)"),
                    enabled: sql.raw("VALUES(enabled)"),
                    updatedAt: new Date(),
                    editAccess: sql.raw("VALUES(edit_access)"),
                    description: sql.raw("VALUES(description)"),
                }
            })
            .$returningId();
        if (!newRuleIds?.length) {
            return NextResponse.json({error: "Failed to create rule"}, {status: 500});
        }
        for (let i = 0; i < newRules.length; i++) {
            const rule = newRules[i] as Record<string, unknown>;
            const ruleId = rule.id as string;
            await insertAuditLog({
                action: "create",
                entityType: "rule",
                entityId: ruleId,
                actorId: user.id,
                payload: {eventId: rule.eventId, name: rule.name},
            });
        }
        const newRule = await db.validations.query.rules.findFirst({
            where: eq(rules.id, (newRuleIds[0] as { id: string }).id),
        });
        return NextResponse.json(newRule, {status: 201});
    } catch (error) {
        console.error("Error creating rule:", error);
        return NextResponse.json({error: "Failed to create rule"}, {status: 500});
    }
}

export async function PUT(req: NextRequest) {
    const user = await getUser();
    if (!user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const data = await req.json();
    const payload: Array<{ id: string; changes: Partial<InsertRule> }> = Array.isArray(data) ? data : [data];


    console.log("Updating rules with payload:", payload);


    try {
        const updatedRuleIds: string[] = [];
        for (const rule of payload) {
            if (!rule.id) {
                return NextResponse.json({error: "Rule id required for update"}, {status: 400});
            }
            const ruleId = rule.id as string;
            delete rule.changes.id;
            await db.validations.update(rules).set({
                ...rule.changes,
                updatedAt: new Date(),
            }).where(eq(rules.id, ruleId));
            updatedRuleIds.push(ruleId);
            await insertAuditLog({
                action: "update",
                entityType: "rule",
                entityId: ruleId,
                actorId: user.id,
                payload: {eventId: rule.changes.eventId, name: rule.changes.name},
            });
        }
        const updatedRules = await db.validations.query.rules.findMany({
            where: inArray(rules.id, updatedRuleIds),
        });
        return NextResponse.json(updatedRules, {status: 200});
    } catch (error) {
        console.error("Error updating rules:", error);
        return NextResponse.json({error: "Failed to update rules"}, {status: 500});
    }
}