import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "~/lib/auth/server";
import { canEditEvent } from "~/lib/db/crud";
import { events } from "~/lib/db/schema";
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ canEdit: false }, { status: 200 });
    }

    const { slug } = await props.params;
    const eventRow = await db.validations.query.events.findFirst({
        where: slugWhere(slug),
    });
    if (!eventRow) {
        return NextResponse.json({ canEdit: false }, { status: 200 });
    }

    const eventId = typeof eventRow.id === "string" ? eventRow.id : String(eventRow.id);
    const canEdit = await canEditEvent(eventId, session.user.id);
    return NextResponse.json({ canEdit }, { status: 200 });
}
