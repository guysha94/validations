import { NextResponse } from "next/server";
import { getMySqlTables } from "~/actions";

export async function GET() {
  try {
    const tables = await getMySqlTables();
    return NextResponse.json(tables);
  } catch (err) {
    console.error(`Failed to fetch MySQL tables: ${err}`);
    const error =
      err instanceof Error ? err : new Error("Failed to fetch MySQL tables.");
    return NextResponse.json({ error }, { status: 500 });
  }
}
