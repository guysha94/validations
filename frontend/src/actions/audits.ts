import "server-only";

import {and, count, eq, like, or, sql} from "drizzle-orm";
import db from "~/db";
import {auditLogs} from "~/db/schema";
import {AsyncResult, AuditLog, PaginatedResponse, PaginationAndSorting} from "~/domain";
import {cacheLife, cacheTag} from "next/cache";
import {uuidv7} from "uuidv7";

const MAX_PAYLOAD_SIZE = 16 * 1024; // 16KB

function truncatePayload<T>(obj: T | null | undefined): T | null {
    if (obj == null) return null;
    const json = JSON.stringify(obj);
    if (json.length <= MAX_PAYLOAD_SIZE) return obj as T;
    return {_truncated: true, _size: json.length} as unknown as T;
}

export async function insertAuditLog(params: Partial<AuditLog>): Promise<void> {
    params.actorType = params.actorId ? "user" : "anonymous";
    params.source = "frontend";
    params.id ??= uuidv7();
    try {
        params.payload = truncatePayload(params.payload);
        await db.insert(auditLogs).values(params as any);
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

const searchAuditLogCountPrepare = db
    .select({total: count()})
    .from(auditLogs)
    .where(
        and(
            eq(auditLogs.teamSlug, sql.placeholder("teamSlug")),
            or(
                like(sql`LOWER(${auditLogs.id})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.action})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.entityType})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.entityId})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.actorId})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.actorType})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.source})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(CAST(${auditLogs.payload} AS CHAR))`, sql.placeholder("likeQuery")),
                like(sql`LOWER(CAST(${auditLogs.metadata} AS CHAR))`, sql.placeholder("likeQuery")),
            )
            )).prepare();

const searchAuditLogPrepare = db
    .select()
    .from(auditLogs)
    .where(
        and(
            eq(auditLogs.teamSlug, sql.placeholder("teamSlug")),
            or(
                like(sql`LOWER(${auditLogs.id})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.action})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.entityType})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.entityId})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.actorId})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.actorType})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(${auditLogs.source})`, sql.placeholder("likeQuery")),
                like(sql`LOWER(CAST(${auditLogs.payload} AS CHAR))`, sql.placeholder("likeQuery")),
                like(sql`LOWER(CAST(${auditLogs.metadata} AS CHAR))`, sql.placeholder("likeQuery")),
            )
        )
    )
    .orderBy(sql`${sql.placeholder('sortingClause')}`)
    .offset(sql.placeholder("offset"))
    .limit(sql.placeholder("limit"))
    .prepare()

const selectAuditLogCountPrepare = db
    .select({total: count()})
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

export async function searchAuditLog(
    teamSlug: string,
    options: PaginationAndSorting,
): AsyncResult<PaginatedResponse<AuditLog>> {
    "use cache";
    cacheLife("minutes");
    cacheTag("audits");
    const {pageIndex, pageSize:limit, sorting, q} = options;

    const offset = pageIndex * limit;
    const likeQuery = `%${q.toLowerCase()}%`;
    console.log("teamSlug:", teamSlug, "q:", q, "likeQuery:", likeQuery, "sorting:", sorting);
    try {
        const [{total}] = await searchAuditLogCountPrepare.execute({
            q,
            teamSlug,
            likeQuery,
        });

        const sortingClause = getSortingClause(sorting);

        const logs = await searchAuditLogPrepare.execute({
            teamSlug,
            likeQuery,
            sortingClause,
            offset,
            limit,
        });

        return {data: {total, rows: logs as any}}
    } catch (err) {
        console.error("Failed to search audit logs:", err);
        const error = err instanceof Error ? err : new Error(String(err))
        return {error};
    }
}

export async function fetchAuditLogs(
    teamSlug: string,
    options: PaginationAndSorting,
): AsyncResult<PaginatedResponse<AuditLog>> {
    "use cache";
    cacheLife("minutes");
    cacheTag("audits");
    const {pageIndex, pageSize, sorting, q} = options;
    if (q?.length) {
        return searchAuditLog(teamSlug, options);
    }
    const offset = pageIndex * pageSize;
    try {
        const [{total}] = await selectAuditLogCountPrepare.execute({teamSlug});

        const sortingClause = getSortingClause(sorting);
        const logs = await db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.teamSlug, teamSlug))
            .orderBy(sql`${sql.raw(sortingClause)}`)
            .offset(offset)
            .limit(pageSize);
        return {data: {total, rows: logs as any}}
    } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        return {error};
    }
}
