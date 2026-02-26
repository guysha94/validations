import { type NextRequest, NextResponse } from "next/server";
import { getEventsWithRulesByTeamSlug } from "~/actions";

type Props = {
  params: Promise<{ teamSlug: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { teamSlug } = await params;

  const { data, error } = await getEventsWithRulesByTeamSlug(teamSlug);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch events:", error);
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  return NextResponse.json(data);
}
