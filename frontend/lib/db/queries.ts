"use server";
import {db} from "@/lib/db";
import {sql} from "drizzle-orm";
import {DbTable} from "~/domain";


const fetchDbTables = `SELECT TABLE_NAME                as name,
                              GROUP_CONCAT(COLUMN_NAME) AS columns
                       FROM INFORMATION_SCHEMA.COLUMNS
                       WHERE TABLE_SCHEMA = 'backend'
                         AND LOWER(TABLE_NAME) NOT like '%migration%'
                       GROUP BY TABLE_NAME;`;

export async function getDbTables(): Promise<DbTable[]> {

    try {
        const queryResult = await db.backend.execute(sql.raw(`${fetchDbTables}`));
        const rows: { name: string, columns: string }[] = queryResult?.length ? queryResult[0] as any : [];
        return rows.map((row) => ({
            name: row.name,
            columns: row.columns.split(",").map((col: string) => col.trim())
        }) as DbTable);
    } catch (error) {
        console.error("Error fetching database tables:", error);
        return [];
    }

}