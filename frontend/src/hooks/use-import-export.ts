"use client";
import { type ChangeEvent, useCallback, useState } from "react";
import type { Event } from "~/domain";
import type { RewardRuleQueryItem } from "~/domain/db-types";
import Papa from "papaparse";
import { toast } from "sonner";
import { uuidv7 } from "uuidv7";
import { useAuth } from "~/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEvents } from "~/hooks/use-events";
import api from "~/lib/api";
import { downloadBlob, slugify } from "~/lib/utils";

type ExportImportFormat = "csv" | "json";

function normalizeRewardQueries(
  raw: unknown,
  fallbackError?: string,
  fallbackDesc?: string,
): RewardRuleQueryItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      {
        query: "SELECT * FROM mtx_event",
        errorMessage: fallbackError ?? "",
        description: fallbackDesc ?? "",
      },
    ];
  }
  const first = raw[0];
  if (typeof first === "string") {
    return raw.map((q) => ({
      query: String(q),
      errorMessage: fallbackError ?? "",
      description: fallbackDesc ?? "",
    }));
  }
  if (first && typeof first === "object" && "query" in first) {
    return raw.map((q: Record<string, unknown>) => ({
      query: String(q.query ?? ""),
      errorMessage: String(q.errorMessage ?? q.error_message ?? ""),
      description: q.description != null ? String(q.description) : "",
    }));
  }
  return [
    {
      query: "SELECT * FROM mtx_event",
      errorMessage: fallbackError ?? "",
      description: fallbackDesc ?? "",
    },
  ];
}


export function useImportExport() {
  const [isImporting, setIsImporting] = useState(false);
    const router = useRouter();
    const {user, activeTeam} = useAuth();
    const {events, activeEvent} = useEvents();

    const importEvents = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !activeTeam || !user) return;
            e.target.value = "";
            setIsImporting(true);
            const existingTypes = new Set(events.map((ev) => ev.type));
            try {
                const ext = file.name.split(".").pop()?.toLowerCase();
                const text = await file.text();
                const toCreate: Array<Event> = [];
                if (ext === "json") {
                    const parsed = JSON.parse(text);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    for (const item of arr) {
                        toCreate.push({
                            id: item.id ?? uuidv7(),
                            type: item.type ?? item.label ?? "",
                            label: item.label ?? item.type ?? "",
                            icon: item.icon ?? "Activity",
                            editAccess: item.editAccess ?? "restricted",
                            eventSchema: item.eventSchema ?? {},
                            createdById: user.id,
                            teamId: activeTeam.id,
                            updatedAt: new Date(),
                        });
                    }
                } else if (ext === "csv") {
                    const {data} = Papa.parse<Record<string, string>>(text, {
                        header: true,
                    });
                    const rows = data ?? [];
                    let current: {
                        type: string;
                        label: string;
                        icon: string;
                        editAccess: string;
                        schema: Record<string, Array<{ name: string; isReward: boolean }>>;
                    } | null = null;
                    for (const row of rows) {
                        const type = (row.type ?? row.Type ?? "").trim();
                        const label = (row.label ?? row.Label ?? type).trim();
                        const icon = (row.icon ?? row.Icon ?? "Activity").trim();
                        const editAccess =
                            (row.editAccess ?? row.edit_access ?? "restricted").trim() ||
                            "restricted";
                        const tab = (row.tab ?? row.Tab ?? "").trim();
                        const column = (row.column ?? row.Column ?? "").trim();
                        const isReward =
                            (row.isReward ?? row.is_reward ?? "false").toLowerCase() ===
                            "true";
                        if (type) {
                            if (current)
                                toCreate.push({
                                    id: row.id ?? uuidv7(),
                                    type: current.type,
                                    label: current.label || current.type,
                                    icon: current.icon,
                                    editAccess: current.editAccess,
                                    eventSchema: current.schema,
                                    createdById: user.id,
                                    teamId: activeTeam.id,
                                    updatedAt: new Date(),
                                });
                            current = {type, label, icon, editAccess, schema: {}};
                        }
                        if (tab && column && current) {
                            if (!current.schema[tab]) current.schema[tab] = [];
                            current.schema[tab].push({name: column, isReward});
                        }
                    }
                    if (current && !existingTypes.has(current.type))
                        toCreate.push({
                            id: current.type
                                ? (rows.find(
                                    (r) => (r.type ?? r.Type ?? "").trim() === current?.type,
                                )?.id ?? uuidv7())
                                : uuidv7(),
                            type: current.type,
                            label: current.label || current.type,
                            icon: current.icon,
                            editAccess: current.editAccess,
                            eventSchema: current.schema,
                            createdById: user.id,
                            teamId: activeTeam.id,
                            updatedAt: new Date(),
                        });
                } else {
                    toast.error("Unsupported format. Use CSV or JSON.");
                    return;
                }
                if (toCreate.length === 0) {
                    toast.error("No valid events found in file");
                    return;
                }

                if (!activeTeam?.slug) {
                    toast.error("No team selected");
                    return;
                }
                await Promise.all(
                    toCreate.map((event) =>
                        api.events.create(activeTeam.slug, {
                            type: event.type,
                            label: event.label,
                            icon: event.icon,
                            editAccess: event.editAccess,
                            eventSchema: event.eventSchema,
                        }),
                    ),
                );

                toast.success(`Imported ${toCreate.length} event(s)`);
                router.refresh();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Import failed");
            } finally {
                setIsImporting(false);
            }
        },
        [activeTeam, user, router],
    );

    const exportEvent = useCallback((event: Event, format: ExportImportFormat) => {
        try {
            let result: string;
            let mimeType: string;
            if (format === "csv") {
                mimeType = "text/csv;charset=utf-8";

                const rows: (Omit<Event, 'eventSchema' | 'id' | 'createdById' | 'updatedAt'> & {
                    eventSchema: string
                })[] = [{
                    type: event.type,
                    label: event.label,
                    icon: event.icon,
                    editAccess: event.editAccess,
                    teamId: event.teamId,
                    eventSchema: JSON.stringify(event.eventSchema)
                }];
                result = Papa.unparse(rows);
            } else {
                mimeType = "application/json";

                const payload = {
                    type: event.type,
                    label: event.label,
                    icon: event.icon,
                    editAccess: event.editAccess,
                    teamId: event.teamId,
                    eventSchema: event.eventSchema ?? {},
                };
                result = JSON.stringify(payload, null, 2);
            }
            const blob = new Blob([result], {type: mimeType});
            downloadBlob(blob, slugify(event.label));
            toast.success("Event exported to CSV");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Export failed");
        }

    }, []);

    const exportSchema = useCallback((tabs: Record<string, string[]>, format: ExportImportFormat) => {
        try {
            let result: string;
            let mimeType: string;
            if (format === "csv") {
                mimeType = "text/csv;charset=utf-8";

                const rows: Array<{ tab: string; column: string }> = [];
                for (const [tabName, columns] of Object.entries(tabs)) {
                    for (const column of columns) {
                        rows.push({tab: tabName, column});
                    }
                }
                result = Papa.unparse(rows);
            } else {
                mimeType = "application/json";
                result = JSON.stringify(tabs, null, 2);
            }
            const blob = new Blob([result], {type: mimeType});
            const filename = activeEvent ? `${slugify(activeEvent.label)}-schema` : "event-schema";
            downloadBlob(blob, filename);
            toast.success("Event schema exported successfully");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Export failed");
        }
    }, [activeEvent]);

    const exportEventRules = useCallback(
      (format: ExportImportFormat) => {
        if (!activeEvent?.eventRules?.length) {
          toast.error("No rules to export");
          return;
        }
        const rows = activeEvent.eventRules.map((r) => ({
          name: r.name,
          description: r.description ?? "",
          errorMessage: r.errorMessage,
          query: r.query,
          enabled: String(r.enabled ?? true),
        }));
        if (format === "csv") {
          const csv = Papa.unparse(rows);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          downloadBlob(
            blob,
            `${slugify(`${activeEvent.label}-rules`)}`,
          );
        } else {
          const payload = activeEvent.eventRules.map((r) => ({
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            enabled: r.enabled ?? true,
          }));
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });
          downloadBlob(
            blob,
            `${slugify(`${activeEvent.label}-rules`)}`,
          );
        }
        toast.success(`Rules exported to ${format.toUpperCase()}`);
      },
      [activeEvent],
    );

    const importEventRules = useCallback(
      async (
        e: ChangeEvent<HTMLInputElement>,
        append: (rule: Record<string, unknown>) => void,
        readOnly?: boolean,
      ) => {
        const file = e.target.files?.[0];
        if (!file || readOnly || !activeEvent) return;
        e.target.value = "";
        setIsImporting(true);
        try {
          const ext = file.name.split(".").pop()?.toLowerCase();
          const text = await file.text();
          let toAdd: Array<{
            name: string;
            description?: string;
            errorMessage: string;
            query: string;
            enabled: boolean;
            editAccess: string;
          }> = [];
          if (ext === "json") {
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            toAdd = arr.map((r: Record<string, unknown>) => ({
              name: String(r.name ?? ""),
              description: r.description != null ? String(r.description) : "",
              errorMessage: String(r.errorMessage ?? r.error_message ?? ""),
              query: String(r.query ?? ""),
              enabled: r.enabled !== false,
              editAccess: String(r.editAccess ?? r.EditAccess ?? "public")
                .trim()
                .toLowerCase(),
            }));
          } else if (ext === "csv") {
            const { data } = Papa.parse<Record<string, string>>(text, {
              header: true,
            });
            toAdd = (data ?? [])
              .map((row) => ({
                name: (row.name ?? row.Name ?? "").trim(),
                description: (row.description ?? row.Description ?? "").trim(),
                errorMessage: (
                  row.errorMessage ??
                  row.error_message ??
                  row["Error Message"] ??
                  ""
                ).trim(),
                query: (row.query ?? row.Query ?? "").trim(),
                enabled:
                  (row.enabled ?? row.Enabled ?? "true").toLowerCase() !==
                  "false",
                editAccess: (row.editAccess ?? row.EditAccess ?? "public")
                  .trim()
                  .toLowerCase(),
              }))
              .filter((r) => r.name || r.query);
          } else {
            toast.error("Unsupported format. Use CSV or JSON.");
            return;
          }
          if (toAdd.length === 0) {
            toast.error("No valid rules found in file");
            return;
          }
          for (const r of toAdd) {
            append({
              id: uuidv7(),
              name: r.name,
              description: r.description ?? "",
              errorMessage: r.errorMessage,
              query: r.query,
              eventId: activeEvent.id,
              enabled: r.enabled,
              editAccess: r.editAccess,
              rewardQueries: [],
              tab: "",
              column: "",
              updatedAt: new Date(),
            });
          }
          toast.success(`Imported ${toAdd.length} rule(s)`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
          setIsImporting(false);
        }
      },
      [activeEvent],
    );

    const exportRewardRules = useCallback(
      (format: ExportImportFormat) => {
        if (!activeEvent?.rewardRules?.length) {
          toast.error("No rules to export");
          return;
        }
        const rows = activeEvent.rewardRules.map((r) => {
          const qs = normalizeRewardQueries(r.queries);
          return {
            name: r.name,
            enabled: String(r.enabled ?? true),
            tab: r.tab ?? "",
            column: r.column ?? "",
            queries: qs.map((q) => q.query).join(" | "),
            queryErrorMessages: qs.map((q) => q.errorMessage).join(" | "),
            queryDescriptions: qs.map((q) => q.description ?? "").join(" | "),
          };
        });
        if (format === "csv") {
          const csv = Papa.unparse(rows);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          downloadBlob(
            blob,
            `${slugify(`${activeEvent.label}-reward-rules`)}`,
          );
        } else {
          const payload = activeEvent.rewardRules.map((r) => ({
            name: r.name,
            enabled: r.enabled ?? true,
            tab: r.tab ?? "",
            column: r.column ?? "",
            queries: normalizeRewardQueries(r.queries),
          }));
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });
          downloadBlob(
            blob,
            `${slugify(`${activeEvent.label}-reward-rules`)}`,
          );
        }
        toast.success(`Rules exported to ${format.toUpperCase()}`);
      },
      [activeEvent],
    );

    const importRewardRules = useCallback(
      async (
        e: ChangeEvent<HTMLInputElement>,
        append: (rule: Record<string, unknown>) => void,
        readOnly?: boolean,
      ) => {
        const file = e.target.files?.[0];
        if (!file || readOnly || !activeEvent) return;
        e.target.value = "";
        setIsImporting(true);
        try {
          const ext = file.name.split(".").pop()?.toLowerCase();
          const text = await file.text();
          let toAdd: Array<{
            name: string;
            enabled: boolean;
            tab: string;
            column: string;
            queries: RewardRuleQueryItem[];
          }> = [];
          if (ext === "json") {
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            toAdd = arr.map((r: Record<string, unknown>) => {
              const queries = normalizeRewardQueries(
                r.queries,
                String(r.errorMessage ?? r.error_message ?? ""),
                String(r.description ?? ""),
              );
              return {
                name: String(r.name ?? ""),
                enabled: r.enabled !== false,
                tab: String(r.tab ?? ""),
                column: String(r.column ?? ""),
                queries,
              };
            });
          } else if (ext === "csv") {
            const { data } = Papa.parse<Record<string, string>>(text, {
              header: true,
            });
            toAdd = (data ?? [])
              .map((row) => {
                const queryStrs = (
                  row.queries ??
                  row.Queries ??
                  "SELECT * FROM mtx_event"
                )
                  .split("|")
                  .map((q) => q.trim())
                  .filter(Boolean);
                const errorMsgs = (
                  row.queryErrorMessages ??
                  row["Query Error Messages"] ??
                  ""
                )
                  .split("|")
                  .map((s) => s.trim());
                const descs = (
                  row.queryDescriptions ??
                  row["Query Descriptions"] ??
                  ""
                )
                  .split("|")
                  .map((s) => s.trim());
                const fallbackErr = (
                  row.errorMessage ??
                  row.error_message ??
                  row["Error Message"] ??
                  ""
                ).trim();
                const fallbackDesc = (
                  row.description ??
                  row.Description ??
                  ""
                ).trim();
                const queries: RewardRuleQueryItem[] = queryStrs.length
                  ? queryStrs.map((q, i) => ({
                      query: q,
                      errorMessage: errorMsgs[i] ?? fallbackErr,
                      description: descs[i] ?? fallbackDesc,
                    }))
                  : [
                      {
                        query: "SELECT * FROM mtx_event",
                        errorMessage: fallbackErr,
                        description: fallbackDesc,
                      },
                    ];
                return {
                  name: (row.name ?? row.Name ?? "").trim(),
                  enabled:
                    (row.enabled ?? row.Enabled ?? "true").toLowerCase() !==
                    "false",
                  tab: (row.tab ?? row.Tab ?? "").trim(),
                  column: (row.column ?? row.Column ?? "").trim(),
                  queries,
                };
              })
              .filter((r) => r.name || r.queries?.length);
          } else {
            toast.error("Unsupported format. Use CSV or JSON.");
            return;
          }
          if (toAdd.length === 0) {
            toast.error("No valid rules found in file");
            return;
          }
          for (const r of toAdd) {
            append({
              id: `new-${uuidv7()}`,
              name: r.name,
              eventId: activeEvent.id,
              enabled: r.enabled,
              tab: r.tab ?? "",
              column: r.column ?? "",
              queries: r.queries?.length
                ? r.queries
                : [
                    {
                      query: "SELECT * FROM mtx_event",
                      errorMessage: "",
                      description: "",
                    },
                  ],
              updatedAt: new Date(),
            });
          }
          toast.success(`Imported ${toAdd.length} rule(s)`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
          setIsImporting(false);
        }
      },
      [activeEvent],
    );

    const importSchema = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            setIsImporting(true);
            try {
                const ext = file.name.split(".").pop()?.toLowerCase();
                const text = await file.text();
                let tabs: Record<string, string[]>;
                if (ext === "json") {
                    tabs = JSON.parse(text);
                } else if (ext === "csv") {
                    const {data} = Papa.parse<Record<string, string>>(text, {
                        header: true,
                    });
                    tabs = {};
                    for (const row of data ?? []) {
                        const tab = (row.tab ?? row.Tab ?? "").trim();
                        const column = (row.column ?? row.Column ?? "").trim();
                        if (tab && column) {
                            if (!tabs[tab]) tabs[tab] = [];
                            tabs[tab].push(column);
                        }
                    }
                } else {
                    toast.error("Unsupported format. Use CSV or JSON.");
                    return;
                }
                if (activeEvent) {
                    await api.events.update(activeEvent.id, {
                        ...activeEvent,
                        eventSchema: tabs
                    });
                    toast.success("Event schema imported successfully");
                    router.refresh();
                } else {
                    toast.error("No active event to import schema into");
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Import failed");
            } finally {
                setIsImporting(false);
            }
        },
        [activeEvent, router],
    );


    return {
      importEvents,
      exportEvent,
      isImporting,
      exportSchema,
      importSchema,
      exportEventRules,
      importEventRules,
      exportRewardRules,
      importRewardRules,
    };
}

