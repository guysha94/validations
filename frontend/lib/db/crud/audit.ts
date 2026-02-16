import "server-only";
import { validationsDb } from "~/lib/db";
import { auditLogs } from "~/lib/db/schema";
import { AuditLogSelect, AuditLogsInsert, PaginationAndSorting } from "~/domain";
import { and, count, eq, sql } from "drizzle-orm";

const MAX_PAYLOAD_SIZE = 16 * 1024; // 16KB

function truncatePayload<T>(obj: T | null | undefined): T | Record<string, unknown> | null {
    if (obj == null) return null;
    const json = JSON.stringify(obj);
    if (json.length <= MAX_PAYLOAD_SIZE) return obj as Record<string, unknown>;
    return { _truncated: true, _size: json.length } as unknown as Record<string, unknown>;
}

export type AuditParams = {
    action: "create" | "update" | "delete";
    entityType: "event" | "rule";
    entityId: string | null;
    actorId: string | null;
    payload?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
};

export async function insertAuditLog(params: AuditLogsInsert): Promise<void> {
    params.actorType = params.actorId ? "user" : "anonymous";
    params.source = "frontend";

    try {
        params.payload = truncatePayload(params.payload);
        await validationsDb.insert(auditLogs).values(params);
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

const searchAuditLogCountPrepare = validationsDb
    .select({ total: count() })
    .from(auditLogs)
    .where(
        and(
            eq(auditLogs.teamSlug, sql.placeholder("teamSlug")),
            sql`MATCH (action, entity_type, entity_id, actor_id, actor_type, source) AGAINST(${sql.placeholder("q")})
            OR LOWER(action) LIKE ${sql.placeholder("likeQuery")}
            OR LOWER(entity_type) LIKE ${sql.placeholder("likeQuery")}
            OR LOWER(entity_id) LIKE ${sql.placeholder("likeQuery")}
            OR LOWER(actor_id) LIKE ${sql.placeholder("likeQuery")}
            OR LOWER(actor_type) LIKE ${sql.placeholder("likeQuery")}
            OR LOWER(source) LIKE ${sql.placeholder("likeQuery")}`
        ))
    .prepare();

const selectAuditLogCountPrepare = validationsDb
    .select({ total: count() })
    .from(auditLogs)
    .where(eq(auditLogs.teamSlug, sql.placeholder("teamSlug")))
    .prepare();


const columnMap: Record<string, string> = {
    action: "action",
    entityType: "entity_type",
    entityId: "entity_id",
    actorId: "actor_id",
    actorType: "actor_type",
    source: "source",
    createdAt: "created_at",
};


function getSortingClause(sorting: PaginationAndSorting["sorting"]): string {
    let sortingClause = ""; // default sorting
    if (sorting?.length) {
        for (const sort of sorting) {
            const column = columnMap[sort.id];
            if (column) {
                sortingClause += `${column} ${sort.desc ? "DESC" : "ASC"}, `;
            }
        }
    }

    if (!sortingClause.length) {
        sortingClause = "created_at DESC"; // default sorting
    }
    return sortingClause;
}

export async function searchAuditLog(teamSlug: string, options: PaginationAndSorting): Promise<[{
    total: number,
    rows: AuditLogSelect[]
}, Error | null]> {

    const { pageIndex, pageSize, sorting, q } = options;


    const offset = pageIndex * pageSize;
    const likeQuery = `%${q.toLowerCase()}%`;
    try {
        const [{ total }] = await searchAuditLogCountPrepare.execute({ q, teamSlug, likeQuery });

        const sortingClause = getSortingClause(sorting);


        const logs = await validationsDb
            .select()
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.teamSlug, teamSlug),
                    sql`MATCH (action, entity_type, entity_id, actor_id, actor_type, source) AGAINST(${q})
                    OR LOWER(action) LIKE ${likeQuery}
                    OR LOWER(entity_type) LIKE ${likeQuery}
                    OR LOWER(entity_id) LIKE ${likeQuery}
                    OR LOWER(actor_id) LIKE ${likeQuery}
                    OR LOWER(actor_type) LIKE ${likeQuery}
                    OR LOWER(source) LIKE ${likeQuery}`
                ))
            .orderBy(sql`${sql.raw(sortingClause)}`)
            .offset(offset)
            .limit(pageSize);


        return [{ total, rows: logs as any }, null];
    } catch (error) {
        console.error("Failed to search audit logs:", error);
        return [{ total: 0, rows: [] }, error instanceof Error ? error : new Error(String(error))];
    }
}


export async function fetchAuditLogs(teamSlug: string, options: PaginationAndSorting): Promise<[{
    total: number,
    rows: AuditLogSelect[]
}, Error | null]> {
    "use cache";
    const { pageIndex, pageSize, sorting, q } = options;
    if (!!q?.length) {
        return await searchAuditLog(teamSlug, options);
    }
    const offset = pageIndex * pageSize;
    try {

        const [{ total }] = await selectAuditLogCountPrepare.execute({ teamSlug });

        const sortingClause = getSortingClause(sorting);
        const logs = await validationsDb
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.teamSlug, teamSlug))
            .orderBy(sql`${sql.raw(sortingClause)}`)
            .offset(offset)
            .limit(pageSize);
        return [{ total, rows: logs as any }, null];
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return [{ total: 0, rows: [] }, error instanceof Error ? error : new Error(String(error))];
    }
}