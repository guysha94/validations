import { NextResponse } from "next/server";
import { getMySqlTables } from "~/actions";
import { z } from "zod";

export const GetDbTablesResponse = z
  .record(z.string(), z.array(z.string()))
  .describe("Map of MySQL table names to their column names");

/**
 * Get MySQL Tables
 * @description Fetches all MySQL tables and their columns from the backend schema. Used for configuring DuckDB views and validation rules.
 * @response GetDbTablesResponse
 * @tag Database
 * @method GET
 * @openapi
 */
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
