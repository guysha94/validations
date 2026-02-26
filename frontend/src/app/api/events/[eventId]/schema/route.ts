import { type NextRequest, NextResponse } from "next/server";
import { updateEventSchema } from "~/actions/events";

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function PUT(req: NextRequest, { params }: Props) {
  const { eventId } = await params;
  if (!eventId?.length) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const data = await req.json();
  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { data: _, error } = await updateEventSchema(eventId, data);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
