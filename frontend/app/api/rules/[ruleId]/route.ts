import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "~/lib/auth/server";
import { canEditRule } from "~/lib/db/crud";
import { rules } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

type Props = {
    params: Promise<{ ruleId: string }>;
};

export async function PUT(req: NextRequest, props: Props) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ruleId } = await props.params;
    const allowed = await canEditRule(ruleId, session.user.id);
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    try {
        const result = await db.validations
            .update(rules)
            .set(data)
            .where(eq(rules.id, ruleId));
        const updated = result[0].affectedRows > 0;
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
        return deleted
            ? NextResponse.json({ success: true, id: ruleId }, { status: 200 })
            : NextResponse.json({ error: "Rule not found" }, { status: 404 });
    } catch (error) {
        console.error("Error deleting rule:", error);
        return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
    }
}

