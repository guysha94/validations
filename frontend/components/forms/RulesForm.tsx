"use client";

import {useFieldArray, useForm} from "react-hook-form";
import {useEffect, useMemo, useState} from "react";
import {ChevronDown, ChevronUp, Plus, Trash2} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardHeader, CardTitle,} from "~/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "~/components/ui/form";
import {rulesCollection} from "~/db/collections";
import {Spinner} from "~/components/ui/spinner";
import {eq, Transaction, useLiveQuery} from "@tanstack/react-db";
import SQLEditor from "~/components/SQLEditor";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import {rulesSchema} from "~/db/schemas";
import {toast} from "sonner"

type RulesFormProps = {
    eventType: string;
    eventId: string;
};

const formsRulesSchema = rulesSchema.omit({createdAt: true, updatedAt: true});

type RuleFormData = z.infer<typeof formsRulesSchema>;

const formSchema = z.object({
    rules: z.array(formsRulesSchema).min(1, {
        message: "At least one rule is" +
            " required"
    }),
});

type FormData = z.infer<typeof formSchema>;

export function RulesFormComponent({eventType, eventId}: RulesFormProps) {
    const {data: rules = [], isLoading} = useLiveQuery(
        (q) => q.from({rules: rulesCollection})
            .where(({rules}) => eq(rules.eventId, eventId)),
    )

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);


    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: "onChange",

    });


    const {fields, append, remove, update} = useFieldArray({
        control: form.control,
        name: "rules",
    });

    const watchAll = useMemo(() => form.watch(), [form]);

    const onSubmit = async (data: FormData) => {
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
    };


    const onRemove = async (index: number) => {

        const ruleId = form.getValues(`rules.${index}`)?.id;
        remove(index);

        if (ruleId.includes("new-")) return;


        const tx = rulesCollection.delete(ruleId, {
            optimistic: true,
        });
        await tx.isPersisted.promise;
    };


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
        checkScrollPosition(); // Check initial position

        return () => window.removeEventListener('scroll', checkScrollPosition);
    }, []);

    useEffect(() => {


        if (isLoading) return;
        if (rules.length > 0) {
            rules.forEach((rule) => {
                append(rule, {shouldFocus: false}
                )
            });

        } else {

            const fromSession = sessionStorage.getItem(`rules-form:${eventType}`);
            if (!!fromSession) {
                const parsed = JSON.parse(fromSession) as { rules: RuleFormData[] };
                if (parsed.rules && parsed.rules.length > 0) {
                    parsed.rules.forEach((rule) => {
                        append({
                                id: rule.id,
                                name: rule.name,
                                errorMessage: rule.errorMessage,
                                query: rule.query,
                                eventId: rule.eventId,
                                enabled: rule.enabled,
                            },
                            {shouldFocus: false}
                        )
                    });
                    return;
                }
            }

            append({
                    id: `new-${crypto.randomUUID()}`,
                    name: "",
                    errorMessage: "",
                    query: "",
                    eventId: eventId,
                    enabled: true,
                },
                {shouldFocus: true});
        }
        requestAnimationFrame(() => {
            // if some editor focused itself, undo it
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.scrollTo({top: 0, left: 0, behavior: "auto"});
        });


    }, [isLoading, rules, form, append, eventId, eventType]);

    // store changes in session storage
    useEffect(() => {
        const dataToStore = {
            rules: watchAll.rules,
        };
        sessionStorage.setItem(`rules-form:${eventType}`, JSON.stringify(dataToStore));
    }, [watchAll, eventType]);


    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>
                            Rules <span className="text-destructive">*</span>
                        </Label>

                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            size="sm"
                            onClick={() =>
                                append({
                                    id: `new-${crypto.randomUUID()}`,
                                    name: "",
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
                    </div>

                    <div className="space-y-4">
                        {fields.map((ruleField, index) => (
                            <Card
                                key={ruleField.id}

                                className="has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
                            >
                                <CardHeader
                                    onClick={() => update(index, {...ruleField, enabled: !ruleField.enabled})}
                                    aria-checked={form.getValues(`rules.${index}.enabled`) ? "true" : "false"}
                                    tabIndex={0}
                                    role="checkbox"
                                    className="pb-4 cursor-pointer">
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
                                                                checked={field.value as boolean}
                                                                onChange={() => field.onChange(!field.value)}
                                                                onBlur={() => field.onBlur()}
                                                                onClick={() => field.onChange(!field.value)}
                                                                className="cursor-pointer data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            {fields.length > 1 && (
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

export const RulesForm = dynamic(() => Promise.resolve(RulesFormComponent), {
    ssr: false,
    loading: () => <div>Loading...</div>,
});

export default RulesForm;
