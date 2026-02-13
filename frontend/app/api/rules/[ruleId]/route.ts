import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "~/lib/auth/server";
import { canEditRule, insertAuditLog } from "~/lib/db/crud";
import { rules } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import {getUser} from "~/lib/actions";

type Props = {
    params: Promise<{ ruleId: string }>;
};

export async function PUT(req: NextRequest, props: Props) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ruleId } = await props.params;
    const allowed = await canEditRule(ruleId, user.id);
    if (!allowed) {
        console.log("User", user.id, "is not allowed to edit rule", ruleId);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    delete data.id;
    data.updatedAt = new Date();
    console.log("Updating rule", ruleId, "with data:", data);

    try {
        const result = await db.validations
            .update(rules)
            .set(data)
            .where(eq(rules.id, ruleId));
        const updated = result[0].affectedRows > 0;
        if (updated) {
            await insertAuditLog({
                action: "update",
                entityType: "rule",
                entityId: ruleId,
                actorId: user.id,
                payload: { name: data.name },
            });
        }
        return updated
            ? NextResponse.json({ message: "Rule updated successfully" }, { status: 200 })
            : NextResponse.json({ error: "Rule not found" }, { status: 404 });
    } catch (error) {
        console.error("Error updating rule:", error);
        return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: Props) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ruleId } = await props.params;
    const allowed = await canEditRule(ruleId, session.user.id);
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const result = await db.validations.delete(rules).where(eq(rules.id, ruleId));
        const deleted = result[0].affectedRows > 0;
        if (deleted) {
            await insertAuditLog({
                action: "delete",
                entityType: "rule",
                entityId: ruleId,
                actorId: session.user.id,
            });
        }
        return deleted
            ? NextResponse.json({ success: true, id: ruleId }, { status: 200 })
            : NextResponse.json({ error: "Rule not found" }, { status: 404 });
    } catch (error) {
        console.error("Error deleting rule:", error);
        return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
    }
}

