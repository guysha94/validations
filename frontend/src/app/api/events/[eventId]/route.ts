import { type NextRequest, NextResponse } from "next/server";
import { updateEvent } from "~/actions/events";
import type { EventWithRules } from "~/domain";

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function PUT(req: NextRequest, { params }: Props) {
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  let data: EventWithRules;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const { data: _, error } = await updateEvent(eventId, {
    type: data.type,
    label: data.label,
    icon: data.icon,
    eventSchema: data.eventSchema ?? undefined,
    editAccess: data.editAccess,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
