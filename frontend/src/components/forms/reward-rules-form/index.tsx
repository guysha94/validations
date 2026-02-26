"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSessionStorage } from "@reactuses/core";
import { ChevronDown, ChevronUp, Download, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import slugify from "slugify";
import { toast } from "sonner";
import { uuidv7 } from "uuidv7";
import Loader from "~/components/Loader";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Form } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { useEvents } from "~/hooks";
import { downloadBlob } from "~/lib/utils";
import { RewardRuleField } from "./reward-rule-field";
import { type FormData, formSchema } from "./schema";

type RewardRuleQueryItem = {
  query: string;
  errorMessage: string;
  description?: string;
};

function normalizeQueries(
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

type RulesFormProps = {
  readOnly?: boolean;
};

const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

export function RewardRulesForm({ readOnly = false }: RulesFormProps) {
  const router = useRouter();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const { activeEvent, isLoading, updateRewardRules } = useEvents();
  const [deletedIds, setDeletedIds] = useSessionStorage<string[]>(
    `reward-rules-form-deleted-${activeEvent?.id}`,
    [],
  );
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    mode: "onChange",
    defaultValues: {
      rules: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  const { clear } = useFormPersist(`reward-rules-form-${activeEvent?.id}`, {
    watch: form.watch,
    setValue: form.setValue,
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  });

  const onSubmit = async (data: FormData) => {
    if (!activeEvent || readOnly) return;
    setIsSubmitting(true);

    try {
      const { data: success, error } = await updateRewardRules(
        data.rules.map((r) => ({
          ...r,
          id: r.id || "",
          eventId: activeEvent.id,
        })),
      );

      if (error || !success) {
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
          {
            closeButton: true,
            duration: 4000,
            style: { backgroundColor: "#f43f5e", color: "white" },
          },
        );
      } else {
        toast.success("Rules saved successfully", {
          closeButton: true,
          duration: 4000,
          richColors: true,
          style: { backgroundColor: "#4ade80", color: "white" },
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred",
        {
          closeButton: true,
          duration: 4000,
          style: { backgroundColor: "#f43f5e", color: "white" },
        },
      );
    } finally {
      setIsSubmitting(false);
      clear();
      router.refresh();
    }
  };

  const onRemove = useCallback(
    (index: number) => {
      const ruleId = form.getValues(`rules.${index}`)?.id;
      if (!ruleId) return;
      setDeletedIds((prev) => Array.from(new Set([...(prev || []), ruleId])));
      remove(index);
      clear();
    },
    [form, remove, setDeletedIds, clear],
  );

  const toggleRuleEnabled = useCallback(
    (index: number) => {
      if (readOnly) return;
      const values = form.getValues(`rules.${index}`);
      if (!values?.id) return;
      update(index, {
        ...values,
        enabled: !values.enabled,
      });
    },
    [update, form, readOnly],
  );

  const exportRulesToCsv = useCallback(() => {
    if (!activeEvent) return;
    const rows = activeEvent.rewardRules?.map((r) => {
      const qs = normalizeQueries(r.queries);
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
    if (rows?.length) {
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(
        blob,
        `${slugify(`${activeEvent?.type}-reward-rules`, { lower: true })}.csv`,
      );
      toast.success("Rules exported to CSV");
    } else {
      toast.error("No rules to export");
    }
  }, [activeEvent]);

  const exportRulesToJson = useCallback(() => {
    if (!activeEvent) return;
    const payload = activeEvent.rewardRules?.map((r) => ({
      name: r.name,
      enabled: r.enabled ?? true,
      tab: r.tab ?? "",
      column: r.column ?? "",
      queries: normalizeQueries(r.queries),
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    downloadBlob(
      blob,
      `${slugify(`${activeEvent.type}-reward-rules`, { lower: true })}.json`,
    );
    toast.success("Rules exported to JSON");
  }, [activeEvent]);

  const handleImportRules = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || readOnly) return;
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
            const queries = normalizeQueries(
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
          const newRule = {
            id: `new-${uuidv7()}`,
            name: r.name,
            eventId: activeEvent?.id,
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
          };
          append(newRule as any);
        }
        toast.success(`Imported ${toAdd.length} rule(s)`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        setIsImporting(false);
      }
    },
    [append, readOnly, activeEvent?.id],
  );

  const handleAddRule = useCallback(() => {
    const newRule = {
      id: `new-${uuidv7()}`,
      name: "",
      eventId: activeEvent?.id,
      enabled: true,
      tab: "",
      column: "",
      queries: [
        { query: "SELECT * FROM mtx_event", errorMessage: "", description: "" },
      ],
      updatedAt: new Date(),
    };
    append(newRule as any, { shouldFocus: true });
  }, [append, activeEvent?.id]);

  const _fieldIdsKey = useMemo(
    () =>
      fields
        .map((f) => f.id)
        .sort()
        .join(","),
    [fields],
  );

  // Collapse all rules by default (add new rules to collapsed set)
  useEffect(() => {
    if (fields.length > 0) {
      const allIds = new Set(fields.map((f) => f.id));
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        let hasChanges = false;
        allIds.forEach((id) => {
          if (!next.has(id)) {
            next.add(id);
            hasChanges = true;
          }
        });
        prev.forEach((id) => {
          if (!allIds.has(id)) {
            next.delete(id);
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [fields.length, fields.map]);

  const handleResetChanges = useCallback(() => {
    if (!activeEvent) return;
    form.reset({
      rules: (activeEvent.rewardRules ?? []).map((r) => ({
        ...r,
        queries: normalizeQueries(r.queries),
      })) as any,
    });
  }, [form, activeEvent]);

  useEffect(() => {
    const checkScrollPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const isBottom = windowHeight + scrollTop >= documentHeight - 100;
      const isTop = scrollTop <= 100;
      setIsAtBottom(isBottom);
      setIsAtTop(isTop);
    };

    window.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  // Initial sync: when form is empty but we have server data, reset to show DB values (errorMessage, description per query)
  useEffect(() => {
    if (!activeEvent?.rewardRules?.length) return;
    const formRules = form.getValues("rules") ?? [];
    if (formRules.length === 0) {
      clear();
      form.reset({
        rules: (activeEvent.rewardRules ?? []).map((r) => ({
          ...r,
          queries: normalizeQueries(r.queries),
        })) as any,
      });
      return;
    }

    const existingIds = new Set(formRules?.map((r) => r.id));
    const toInsert =
      activeEvent.rewardRules?.filter(
        (r) =>
          !r.id.startsWith("new-") &&
          !existingIds.has(r.id) &&
          !deletedIds?.includes(r.id),
      ) ?? [];

    if (toInsert?.length) {
      for (const r of toInsert) {
        const replacement = formRules?.find(
          (fr) =>
            fr.name === r.name &&
            JSON.stringify(fr.queries) === JSON.stringify(r.queries),
        );
        const ruleWithQueries = {
          ...r,
          queries: normalizeQueries(r.queries),
        };
        if (!replacement) {
          append(ruleWithQueries as any);
        } else {
          update(
            formRules.findIndex((fr) => fr.name === r.name),
            ruleWithQueries as any,
          );
        }
      }
    }

    for (const r of formRules.filter((r) => r?.id?.startsWith("new-"))) {
      const replacement = activeEvent.rewardRules?.find(
        (rule) =>
          rule.name === r.name &&
          JSON.stringify(rule.queries) === JSON.stringify(r.queries),
      );
      if (replacement) {
        update(
          formRules.findIndex((fr) => fr.name === r.name),
          {
            ...replacement,
            queries: normalizeQueries(replacement.queries),
          } as any,
        );
      }
    }
  }, [activeEvent, append, update, deletedIds, form, clear]);

  if (isLoading) return <Loader fullscreen />;

  if (!activeEvent) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-muted-foreground">
          Please select an event to manage its reward rules.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>
              Reward Rules <span className="text-destructive">*</span>
            </Label>

            <div className="flex items-center gap-1">
              {!readOnly && (
                <>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={handleImportRules}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isImporting}
                    onClick={() => importFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? "Importing…" : "Import"}
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={activeEvent?.rewardRules?.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={exportRulesToCsv}
                    disabled={activeEvent?.rewardRules?.length === 0}
                  >
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={exportRulesToJson}
                    disabled={activeEvent?.rewardRules?.length === 0}
                  >
                    Export to JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  size="sm"
                  onClick={handleAddRule}
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {fields?.map((ruleField, index) => (
              <RewardRuleField
                key={ruleField.id}
                index={index}
                form={form as any}
                fields={fields}
                eventSchema={
                  (activeEvent?.eventSchema ?? {}) as Record<
                    string,
                    Array<{
                      name: string;
                      isReward?: boolean;
                    }>
                  >
                }
                onRemove={onRemove}
                ruleField={ruleField}
                readOnly={readOnly}
                toggleRuleEnabled={toggleRuleEnabled}
                isCollapsed={collapsedIds.has(ruleField.id)}
                onToggleCollapse={() => {
                  setCollapsedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(ruleField.id)) next.delete(ruleField.id);
                    else next.add(ruleField.id);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center justify-end pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleResetChanges}
            >
              Reset Changes
            </Button>
            <Button
              type="button"
              onClick={async () => await onSubmit(form.getValues())}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </form>

      {isAtTop && (activeEvent?.rewardRules?.length || 0) >= 5 && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={scrollToBottom}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)] hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-300 cursor-pointer hover:scale-110"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
      {isAtBottom && (activeEvent?.rewardRules?.length || 0) >= 5 && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-50 rounded-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)] hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-300 cursor-pointer hover:scale-110"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </Form>
  );
}
