import "server-only";
import { validationsDb } from "~/lib/db";
import { auditLogs } from "~/lib/db/schema";

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

export async function insertAuditLog(params: AuditParams): Promise<void> {
    try {
        const payload = truncatePayload(params.payload);
        await validationsDb.insert(auditLogs).values({
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            actorId: params.actorId,
            actorType: params.actorId ? "user" : "anonymous",
            source: "frontend",
            payload: payload ?? undefined,
            metadata: params.metadata ?? undefined,
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Do not rethrow - audit failure must not fail the main operation
    }
}
