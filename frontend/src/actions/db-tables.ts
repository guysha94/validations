"use server";
import DbClient from "~/db/client";

const query = `SELECT TABLE_NAME as name,
                      CONCAT('[', GROUP_CONCAT(JSON_QUOTE(COLUMN_NAME) ORDER BY ORDINAL_POSITION), ']') AS columns
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = 'backend'
                 AND LOWER(TABLE_NAME) NOT like '%migration%'
               GROUP BY TABLE_NAME;`;

export async function getMySqlTables() {
  "use cache";
  try {
    await DbClient.backendPool.query(
      "SET SESSION group_concat_max_len = 65535",
    );
    const [rows] = await DbClient.backendPool.query(query);
    const tables: Record<string, string[]> = {};
    for (const row of rows as { name: string; columns: string }[]) {
      try {
        tables[row.name] = JSON.parse(row.columns);
      } catch {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Failed to parse columns for table ${row.name}:`,
            row.columns,
          );
        }
      }
    }
    return tables;
  } catch (err) {
    console.error("Error fetching MySQL tables:", err);
    const error =
      err instanceof Error ? err : new Error("Failed to fetch MySQL tables.");
    throw error;
  }
}
