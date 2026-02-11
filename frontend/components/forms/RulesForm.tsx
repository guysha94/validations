"use client";

import {useFieldArray, useForm} from "react-hook-form";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ChevronDown, ChevronUp, Download, Plus, Trash2, Upload} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardHeader, CardTitle,} from "~/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "~/components/ui/form";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {rulesCollection} from "~/lib/db/collections";
import {Spinner} from "~/components/ui/spinner";
import {Transaction} from "@tanstack/react-db";
import SQLEditor from "~/components/SQLEditor";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {rulesSchema} from "~/lib/db/schemas";
import {toast} from "sonner"
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import Papa from "papaparse";
import slugify from "slugify";


type RulesFormProps = {
    eventType: string;
    eventId: string;
    readOnly?: boolean;
};

const formsRulesSchema = rulesSchema.omit({updatedAt: true});

type RuleFormData = z.infer<typeof formsRulesSchema>;

const formSchema = z.object({
    rules: z.array(formsRulesSchema).min(1, {
        message: "At least one rule is" +
            " required"
    }),
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

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function RulesForm({eventType, eventId, readOnly = false}: RulesFormProps) {
    const importFileRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const {
        rules: initialRules,
    } = useValidationsStore(useShallow((state) => state));

    const rules = useMemo(() => initialRules?.[eventType], [initialRules, eventType]);

    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            rules: rules,
        }
    });


    const {fields, append, remove, update} = useFieldArray({
        control: form.control,
        name: "rules",
    });

    const watchAll = useMemo(() => form.watch(), [form]);

    const onSubmit = useCallback(async (data: FormData) => {
        if (readOnly) return;
        setIsSubmitting(true);

        try {

            const {toInsert, toUpdate} = data.rules.reduce((acc, r) => {
                if (r.id.includes("new-")) acc.toInsert.push(r);
                else acc.toUpdate.push(r);
                return acc;
            }, {toInsert: [] as typeof data.rules, toUpdate: [] as typeof data.rules});
            const tasks: Promise<Transaction<Record<string, unknown>>>[] = [];
            if (toInsert.length) {
                const insertTx = rulesCollection.insert(toInsert.map(r => rulesSchema.parse(r)));
                tasks.push(insertTx.isPersisted.promise)

            }


            if (toUpdate.length) {

                const updateTx = rulesCollection.update(toUpdate.map(r => r.id),
                    {
                        optimistic: true,
                    }, (drafts) => {
                        drafts.forEach((draft) => {
                            const updated = toUpdate.find(r => r.id === draft.id);
                            if (updated) {
                                draft.name = updated.name;
                                draft.errorMessage = updated.errorMessage;
                                draft.query = updated.query;
                                draft.enabled = updated.enabled;
                            }
                        })
                    });
                tasks.push(updateTx.isPersisted.promise);
            }

            if (tasks.length > 0) {
                await Promise.all(tasks);
            }

            toast.success("Rules saved successfully", {
                closeButton: true,
                duration: 4000,
                richColors: true,
                style: {backgroundColor: "#4ade80", color: "white"},
            })


        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred", {
                closeButton: true,
                duration: 4000,
                style: {backgroundColor: "#f43f5e", color: "white"},
            });
        } finally {
            setIsSubmitting(false);
        }
    }, []);


    const onRemove = useCallback(async (index: number) => {

        const ruleId = form.getValues(`rules.${index}`)?.id;
        remove(index);

        if (ruleId.includes("new-")) return;


        const tx = rulesCollection.delete(ruleId, {
            optimistic: true,
        });
        await tx.isPersisted.promise;
    }, [remove, form]);

    const toggleRuleEnabled = useCallback((index: number) => {
        if (readOnly) return;
        update(index, {
            ...form.getValues(`rules.${index}`),
            enabled: !(form.getValues(`rules.${index}.enabled`) ?? true),
        })
    }, [update, form, readOnly]);

    const rulesForExport = form.watch("rules") ?? [];

    const exportRulesToCsv = useCallback(() => {
        const rows = rulesForExport.map((r) => ({
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            enabled: String(r.enabled ?? true),
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob,  slugify(`${eventType}-rules`).toLowerCase() + ".csv");
        toast.success("Rules exported to CSV");
    }, [rulesForExport, eventType]);

    const exportRulesToJson = useCallback(() => {
        const payload = rulesForExport.map((r) => ({
            name: r.name,
            description: r.description ?? "",
            errorMessage: r.errorMessage,
            query: r.query,
            enabled: r.enabled ?? true,
        }));
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        downloadBlob(blob, slugify(`${eventType}-rules`).toLowerCase() + ".json");
        toast.success("Rules exported to JSON");
    }, [rulesForExport, eventType]);

    const handleImportRules = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || readOnly) return;
            e.target.value = "";
            setIsImporting(true);
            try {
                const ext = file.name.split(".").pop()?.toLowerCase();
                const text = await file.text();
                let toAdd: Array<{ name: string; description?: string; errorMessage: string; query: string; enabled: boolean }> = [];
                if (ext === "json") {
                    const parsed = JSON.parse(text);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    toAdd = arr.map((r: Record<string, unknown>) => ({
                        name: String(r.name ?? ""),
                        description: r.description != null ? String(r.description) : "",
                        errorMessage: String(r.errorMessage ?? r.error_message ?? ""),
                        query: String(r.query ?? ""),
                        enabled: r.enabled !== false,
                    }));
                } else if (ext === "csv") {
                    const { data } = Papa.parse<Record<string, string>>(text, { header: true });
                    toAdd = (data ?? []).map((row) => ({
                        name: (row.name ?? row.Name ?? "").trim(),
                        description: (row.description ?? row.Description ?? "").trim(),
                        errorMessage: (row.errorMessage ?? row.error_message ?? row["Error Message"] ?? "").trim(),
                        query: (row.query ?? row.Query ?? "").trim(),
                        enabled: (row.enabled ?? row.Enabled ?? "true").toLowerCase() !== "false",
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
                    append({
                        id: `new-${crypto.randomUUID()}`,
                        name: r.name,
                        description: r.description ?? "",
                        errorMessage: r.errorMessage,
                        query: r.query,
                        eventId,
                        enabled: r.enabled,
                    });
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
        const dataToStore = {
            rules: watchAll.rules,
        };
        sessionStorage.setItem(`rules-form:${eventType}`, JSON.stringify(dataToStore));
    }, [watchAll, eventType]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        disabled={rulesForExport.length === 0}
                                    >
                                        <Download className="h-4 w-4"/>
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={exportRulesToCsv}
                                        disabled={rulesForExport.length === 0}
                                    >
                                        Export to CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={exportRulesToJson}
                                        disabled={rulesForExport.length === 0}
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
                                    onClick={() =>
                                        append({
                                            id: `new-${crypto.randomUUID()}`,
                                            name: "",
                                            description: "",
                                            errorMessage: "",
                                            query: "",
                                            eventId: eventId,
                                            enabled: true,
                                        }, {shouldFocus: true})
                                    }
                                >
                                    <Plus className="h-4 w-4"/>
                                    Add Rule
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {fields.map((ruleField, index) => (
                            <Card
                                key={ruleField.id}

                                className="has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
                            >
                                <CardHeader
                                    onClick={() => toggleRuleEnabled(index)}
                                    aria-checked={form.getValues(`rules.${index}.enabled`) ? "true" : "false"}
                                    tabIndex={readOnly ? undefined : 0}
                                    role="checkbox"
                                    className={`pb-4 ${readOnly ? "" : "cursor-pointer"}`}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Rule {index + 1}
                                        </CardTitle>
                                        <div className="flex">
                                            <FormField
                                                control={form.control}
                                                name={`rules.${index}.enabled`}
                                                render={({field}) => (
                                                    <FormItem
                                                        className="flex flex-row-reverse items-center space-x-1 space-y-0 mr-4">
                                                        <FormLabel
                                                            htmlFor={`rules.${index}.enabled`}
                                                            className="mb-0"
                                                        >
                                                            Enabled
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Checkbox
                                                                id={`rules.${index}.enabled`}
                                                                defaultChecked
                                                                checked={(typeof field?.value === 'undefined' ? true : field.value) as boolean}
                                                                onBlur={() => field.onBlur()}
                                                                onClick={() => toggleRuleEnabled(index)}
                                                                disabled={readOnly}
                                                                className="cursor-pointer data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            {!readOnly && fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () =>
                                                        await onRemove(index)
                                                    }
                                                    className="text-destructive hover:text-destructive cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Rule Name */}
                                    <FormField
                                        control={form.control}
                                        name={`rules.${index}.name`}
                                        rules={{required: "Rule name is required"}}
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Name <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-background"
                                                        placeholder="e.g., email_format_check"
                                                        readOnly={readOnly}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Error Message */}
                                    <FormField
                                        control={form.control}
                                        name={`rules.${index}.errorMessage`}
                                        rules={{required: "Error message is required"}}
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Error Message{" "}
                                                    <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-background"
                                                        placeholder="e.g., Invalid email format"
                                                        readOnly={readOnly}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Query */}
                                    <FormField
                                        control={form.control}
                                        name={`rules.${index}.query`}
                                        rules={{required: "Query is required"}}
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Query <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <SQLEditor
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="e.g., email LIKE '%@%.%'"
                                                        readOnly={readOnly}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center justify-end pt-4">
                        <Button
                            type="submit"
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

