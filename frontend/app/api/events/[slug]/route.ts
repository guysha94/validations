import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "~/lib/auth/server";
import { canEditEvent } from "~/lib/db/crud";
import { events } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";

type Props = {
    params: Promise<{ slug: string }>;
};

const slugWhere = (slug: string) =>
    or(
        eq(events.id, slug),
        eq(sql<string>`LOWER(${events.type})`, slug.toLowerCase())
    );

export async function GET(req: NextRequest, props: Props) {
    const { slug } = await props.params;
    try {
        const event = await db.validations.query.events.findFirst({
            where: slugWhere(slug),
        });
        return NextResponse.json(event, { status: 200 });
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: Props) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await props.params;
    const eventRow = await db.validations.query.events.findFirst({
        where: slugWhere(slug),
    });
    if (!eventRow) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventId = typeof eventRow.id === "string" ? eventRow.id : String(eventRow.id);
    const allowed = await canEditEvent(eventId, session.user.id);
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    delete data.id;
    delete data.teamId;
    delete data.createdById;
    delete data.updatedAt;
    try {
        await db.validations.update(events).set(data).where(slugWhere(slug));
        const updated = await db.validations.query.events.findFirst({
            where: slugWhere(slug),
        });
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: Props) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await props.params;
    const eventRow = await db.validations.query.events.findFirst({
        where: slugWhere(slug),
    });
    if (!eventRow) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventId = typeof eventRow.id === "string" ? eventRow.id : String(eventRow.id);
    const allowed = await canEditEvent(eventId, session.user.id);
    if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await db.validations.delete(events).where(slugWhere(slug));
        return NextResponse.json({ success: true, id: eventId }, { status: 200 });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}