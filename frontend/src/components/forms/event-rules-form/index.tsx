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
import { RuleField } from "./rule-field";
import { type FormData, formSchema } from "./schema";

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

export function EventRulesForm({ readOnly = false }: RulesFormProps) {
  const router = useRouter();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const { activeEvent, isLoading, updateEventRules } = useEvents();
  const [deletedIds, setDeletedIds] = useSessionStorage<string[]>(
    `rules-form-deleted-${activeEvent?.id}`,
    [],
  );
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    mode: "onChange",
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  const { clear } = useFormPersist(`event-rules-form-${activeEvent?.id}`, {
    watch: form.watch,
    setValue: form.setValue,
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  });

  const onSubmit = async (data: FormData) => {
    if (!activeEvent || readOnly) return;

    setIsSubmitting(true);

    try {
      const { data: succeeded, error } = await updateEventRules(
        data.rules.map((r) => ({
          ...r,
          eventId: activeEvent.id,
          updatedAt: new Date(),
          id: r.id || uuidv7(),
        })),
      );

      if (succeeded) {
        toast.success("Rules saved successfully", {
          closeButton: true,
          duration: 4000,
          richColors: true,
          style: { backgroundColor: "#4ade80", color: "white" },
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
          {
            closeButton: true,
            duration: 4000,
            style: { backgroundColor: "#f43f5e", color: "white" },
          },
        );
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
    const rows = activeEvent.eventRules?.map((r) => ({
      name: r.name,
      description: r.description ?? "",
      errorMessage: r.errorMessage,
      query: r.query,
      enabled: String(r.enabled ?? true),
    }));
    if (rows?.length) {
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(
        blob,
        `${slugify(`${activeEvent?.type}-rules`, { lower: true })}.csv`,
      );
      toast.success("Rules exported to CSV");
    } else {
      toast.error("No rules to export");
    }
  }, [activeEvent]);

  const exportRulesToJson = useCallback(() => {
    if (!activeEvent) return;
    const payload = activeEvent.eventRules?.map((r) => ({
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
      `${slugify(`${activeEvent.type}-rules`, { lower: true })}.json`,
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
              tab: "",
              column: "",
              rewardQueries: [],
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
          const newRule = {
            id: uuidv7(),
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            eventId: activeEvent?.id,
            enabled: r.enabled,
            editAccess: r.editAccess,
            rewardQueries: [],
            tab: "",
            column: "",
            updatedAt: new Date(),
          };
          append(newRule);
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
      description: "",
      errorMessage: "",
      query: "",
      eventId: activeEvent?.id,
      enabled: true,
      editAccess: "public",
      rewardQueries: [],
      tab: "",
      column: "",
      updatedAt: new Date(),
    };

    append(newRule, { shouldFocus: true });
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
      rules: (activeEvent.eventRules ?? []).map((r) => ({ ...r }) as any),
    });
  }, [form, activeEvent]);

  useEffect(() => {
    const checkScrollPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const isBottom = windowHeight + scrollTop >= documentHeight - 100; // 100px threshold
      const isTop = scrollTop <= 100; // 100px threshold
      setIsAtBottom(isBottom);
      setIsAtTop(isTop);
    };

    window.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  useEffect(() => {
    if (!activeEvent) return;

    const formRules = form.getValues("rules") ?? [];
    const existingIds = new Set(formRules?.map((r) => r.id));
    const toInsert =
      activeEvent.eventRules?.filter(
        (r) =>
          !r.id.startsWith("new-") &&
          !existingIds.has(r.id) &&
          !deletedIds?.includes(r.id),
      ) ?? [];

    if (toInsert?.length) {
      for (const r of toInsert) {
        const replacement = formRules?.find(
          (fr) =>
            fr.id === r.id || (fr.name === r.name && fr.query === r.query),
        );
        if (!replacement) {
          append({ ...r } as any);
        } else {
          const idx = formRules.findIndex((fr) => fr.id === replacement.id);
          if (idx >= 0) update(idx, { ...r } as any);
        }
      }
    }

    for (const r of formRules.filter((r) => r?.id?.startsWith("new-"))) {
      const replacement = activeEvent.eventRules?.find(
        (rule) => rule.name === r.name && rule.query === r.query,
      );
      if (replacement) {
        const idx = formRules.findIndex((fr) => fr.id === r.id);
        if (idx >= 0) update(idx, { ...replacement } as any);
      }
    }
  }, [activeEvent, append, update, deletedIds, form.getValues]);

  if (isLoading) return <Loader fullscreen />;

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>
              Rules <span className="text-destructive">*</span>
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
                    disabled={activeEvent?.eventRules?.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={exportRulesToCsv}
                    disabled={activeEvent?.eventRules?.length === 0}
                  >
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={exportRulesToJson}
                    disabled={activeEvent?.eventRules?.length === 0}
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
              <RuleField
                key={ruleField.id}
                index={index}
                form={form as any}
                fields={fields}
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

      {isAtTop && (activeEvent?.eventRules?.length || 0) >= 5 && (
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
      {isAtBottom && (activeEvent?.eventRules?.length || 0) >= 5 && (
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
