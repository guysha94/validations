"use client";

import {useFieldArray, useForm} from "react-hook-form";
import {ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ChevronDown, ChevronUp, Download, Plus, Upload} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Label} from "@/components/ui/label"
import {Form,} from "~/components/ui/form";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Spinner} from "~/components/ui/spinner";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {rulesSchema,} from "~/lib/db/schemas";
import {toast} from "sonner"
import Papa from "papaparse";
import slugify from "slugify";
import {useRules} from "~/hooks";
import Loader from "~/components/Loader";
import {uuidv7} from "uuidv7";
import {downloadBlob} from "~/lib/utils";
import {useSessionStorage} from "@reactuses/core";
import useFormPersist from "react-hook-form-persist";
import RulesField from "~/components/forms/rules-form/RulesField";

type RulesFormProps = {
    eventType: string;
    eventId: string;
    readOnly?: boolean;
};


const formSchema = z.object({
    rules: z.array(rulesSchema),
});

type FormData = z.infer<typeof formSchema>;

const scrollToBottom = () => {
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
};

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};


export function RulesForm({eventType, eventId, readOnly = false}: RulesFormProps) {
    const importFileRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const [deletedIds, setDeletedIds] = useSessionStorage<string[]>(`rules-form-deleted-${eventId}`, []);
    const {rules, isReady, upsert, deleteMany} = useRules();
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onChange",

    });

    const {fields, append, remove, update} = useFieldArray({
        control: form.control,
        name: "rules",
    });
    const isLoading = useMemo(() => !isReady || !eventId || !eventType, [isReady, eventId, eventType]);

    const {clear} = useFormPersist(`rules-form-${eventId}`, {
        watch: form.watch,
        setValue: form.setValue,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    });

    const onSubmit = async (data: FormData) => {


        if (readOnly) return;
        setIsSubmitting(true);

        try {
            const tasks: any = [];
            const toUpsert = data.rules.map(r => ({...r, eventId, updatedAt: new Date()}));
            tasks.push(upsert(toUpsert));
            if (deletedIds?.length) {
                console.log("Deleting rules with ids:", deletedIds);
                tasks.push(deleteMany(deletedIds));
            }
            await Promise.all(tasks);

            setDeletedIds([]);
            toast.success("Rules saved successfully", {
                closeButton: true,
                duration: 4000,
                richColors: true,
                style: {backgroundColor: "#4ade80", color: "white"},
            });

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred", {
                closeButton: true,
                duration: 4000,
                style: {backgroundColor: "#f43f5e", color: "white"},
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    const onRemove = useCallback((index: number) => {

        const ruleId = form.getValues(`rules.${index}`)?.id;
        if (!ruleId) return;
        setDeletedIds((prev) => Array.from(new Set([...(prev || []), ruleId])));

        remove(index);
        clear();


    }, [form, remove, setDeletedIds, clear]);

    const toggleRuleEnabled = useCallback((index: number) => {
        if (readOnly) return;
        const values = form.getValues(`rules.${index}`);
        if (!values?.id) return;
        update(index, {
            ...values,
            enabled: !values.enabled,
        })
    }, [update, form, readOnly]);


    const exportRulesToCsv = useCallback(() => {
        const rows = rules.map((r) => ({
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            enabled: String(r.enabled ?? true),
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
        downloadBlob(blob, slugify(`${eventType}-rules`).toLowerCase() + ".csv");
        toast.success("Rules exported to CSV");
    }, [rules, eventType]);

    const exportRulesToJson = useCallback(() => {
        const payload = rules.map((r) => ({
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            enabled: r.enabled ?? true,
        }));
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
        downloadBlob(blob, slugify(`${eventType}-rules`).toLowerCase() + ".json");
        toast.success("Rules exported to JSON");
    }, [rules, eventType]);

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
                    enabled: boolean,
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
                        editAccess: String(r.editAccess ?? r.EditAccess ?? "public").trim().toLowerCase(),
                    }));
                } else if (ext === "csv") {
                    const {data} = Papa.parse<Record<string, string>>(text, {header: true});
                    toAdd = (data ?? []).map((row) => ({
                        name: (row.name ?? row.Name ?? "").trim(),
                        description: (row.description ?? row.Description ?? "").trim(),
                        errorMessage: (row.errorMessage ?? row.error_message ?? row["Error Message"] ?? "").trim(),
                        query: (row.query ?? row.Query ?? "").trim(),
                        enabled: (row.enabled ?? row.Enabled ?? "true").toLowerCase() !== "false",
                        editAccess: (row.editAccess ?? row.EditAccess ?? "public").trim().toLowerCase(),
                    })).filter((r) => r.name || r.query);
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
                        eventId,
                        enabled: r.enabled,
                        editAccess: r.editAccess,
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
        [append, eventId, readOnly]
    );

    const handleAddRule = useCallback(() => {

        const newRule = {
            id: `new-${uuidv7()}`,
            name: "",
            description: "",
            errorMessage: "",
            query: "",
            eventId: eventId,
            enabled: true,
            editAccess: "public",
            updatedAt: new Date(),
        };

        append(newRule, {shouldFocus: true})
    }, [append, eventId]);

    const handleResetChanges = useCallback(() => {

        form.reset({
            rules: (rules ?? []).map(r => ({...r})),
        });
    }, [form, rules]);

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

        window.addEventListener('scroll', checkScrollPosition);
        checkScrollPosition();

        return () => window.removeEventListener('scroll', checkScrollPosition);
    }, []);

    useEffect(() => {
        if (!eventId || !isReady) return;

        const formRules = form.getValues("rules") ?? [];
        const existingIds = new Set(formRules?.map(r => r.id));
        const toInsert = rules?.filter(r =>
            !r.id.startsWith("new-") && !existingIds.has(r.id) && !deletedIds?.includes(r.id)) ?? [];

        if (!!toInsert?.length) {
            for (const r of toInsert) {
                const replacement = formRules?.find(fr => fr.name === r.name && fr.query === r.query);
                if (!replacement) {
                    append(r);
                } else {
                    update(formRules.findIndex(fr => fr.query === r.query), r);
                }
            }
        }

        for (const r of formRules.filter(r => r?.id?.startsWith("new-"))) {
            const replacement = rules?.find(rule => rule.name === r.name && rule.query === r.query);
            if (replacement) {
                update(formRules.findIndex(fr => fr.query === r.query), replacement);
            }
        }


    }, [isReady, rules, append, eventId, deletedIds, form, update]);


    if (isLoading) {
        return <Loader fullscreen/>
    }


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
                                        <Upload className="h-4 w-4"/>
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
                                        disabled={rules?.length === 0}
                                    >
                                        <Download className="h-4 w-4"/>
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={exportRulesToCsv}
                                        disabled={rules?.length === 0}
                                    >
                                        Export to CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={exportRulesToJson}
                                        disabled={rules?.length === 0}
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
                                    <Plus className="h-4 w-4"/>
                                    Add Rule
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {fields?.map((ruleField, index) => (
                            <RulesField
                                index={index}
                                form={form}
                                fields={fields}
                                onRemove={onRemove}
                                ruleField={ruleField}
                                readOnly={readOnly}
                                toggleRuleEnabled={toggleRuleEnabled}
                                key={ruleField.id}/>

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
                            {isSubmitting && <Spinner/>}
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                )}
            </form>

            {isAtTop && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollToBottom}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)] hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-300 cursor-pointer hover:scale-110"
                    aria-label="Scroll to bottom"
                >
                    <ChevronDown className="h-5 w-5"/>
                </Button>
            )}
            {isAtBottom && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollToTop}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-50 rounded-full backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)] hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-300 cursor-pointer hover:scale-110"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="h-5 w-5"/>
                </Button>
            )}
        </Form>
    );
}

