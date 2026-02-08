"use client";

import {useFieldArray, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {eventsCollection} from "~/lib/db/collections";
import {useEffect, useState} from "react";
import {ChevronDown, ChevronUp, Plus, Trash2} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Checkbox} from "~/components/ui/checkbox";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Label} from "~/components/ui/label";
import {Spinner} from "~/components/ui/spinner";
import {toast} from "sonner";
import {EventsSchema} from "~/lib/db/schemas";
import _ from "lodash";


const formColumnsSchema = z.object({
    name: z.string().min(1, "Column name is required"),
    isReward: z.boolean(),
});
const formTabsSchema = z.object({
    name: z.string().min(1, "Tab name is required"),
    columns: z.array(formColumnsSchema),
});

const formSchema = z.object({
    tabs: z.array(formTabsSchema).min(1, {
        message: "At least one tab is required",
    }),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
    event: EventsSchema
};

export default function SchemaForm({event}: Props) {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [collapsedTabs, setCollapsedTabs] = useState<Set<string>>(new Set());


    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            tabs: !!event?.eventSchema && Object.keys(event.eventSchema)?.length > 0
                ? Object.entries(event.eventSchema)
                    .map(([tabName, columns]) => ({
                    name: tabName,
                    columns: columns.map((col) => ({
                        name: col.name,
                        isReward: col.isReward ?? false,
                    })),
                })).sort((a, b) => a.name.localeCompare(b.name))
                : []
        },
    });

    const {fields: tabFields, append: appendTab, remove: removeTab} = useFieldArray({
        control: form.control,
        name: "tabs",
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        console.log("Submitting form with data:", data);
        setIsSubmitting(true);

        try {

            const schemaObj = Object.fromEntries(data.tabs.map((tab) => [tab.name, tab.columns]));

            const updateTx = eventsCollection.update(
                event.id,
                {
                    optimistic: true,
                },
                (draft) => {
                    draft.eventSchema = schemaObj;
                }
            );
            await updateTx.isPersisted.promise;

            toast.success("Schema saved successfully", {
                closeButton: true,
                duration: 4000,
                richColors: true,
                style: {backgroundColor: "#4ade80", color: "white"},
            });
            setIsSubmitting(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred", {
                closeButton: true,
                duration: 4000,
                style: {backgroundColor: "#f43f5e", color: "white"},
            });
            setIsSubmitting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

  
    // Collapse all tabs by default (add new tabs to collapsed set)
    useEffect(() => {
        if (tabFields.length > 0) {
            const allTabIds = new Set(tabFields.map(field => field.id));

            setCollapsedTabs(prevCollapsed => {
                const currentCollapsed = new Set(prevCollapsed);
                let hasChanges = false;

                // Add any new tabs to collapsed set (they're collapsed by default)
                allTabIds.forEach(id => {
                    if (!currentCollapsed.has(id)) {
                        currentCollapsed.add(id);
                        hasChanges = true;
                    }
                });

                // Remove tabs that no longer exist
                prevCollapsed.forEach(id => {
                    if (!allTabIds.has(id)) {
                        currentCollapsed.delete(id);
                        hasChanges = true;
                    }
                });

                // Only return new set if there are changes to avoid unnecessary re-renders
                return hasChanges ? currentCollapsed : prevCollapsed;
            });
        }
    }, [tabFields.map(f => f.id).join(',')]); // Use tab IDs as dependency instead of the whole array

    // if (isLoading) return <Loader fullscreen/>;

    if (!event) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Please select an event to configure its schema.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col min-h-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full space-y-6 w-full">
                    <div className="flex flex-col flex-1 space-y-4 min-h-0">
                        <div className="flex items-center justify-between shrink-0">
                            <Label>
                                Schema Tabs <span className="text-destructive">*</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                size="sm"
                                onClick={() => {
                                    appendTab({
                                        name: "",
                                        columns: [],
                                    });
                                    // New tab will be collapsed by default (handled in useEffect)
                                }}
                            >
                                <Plus className="h-4 w-4"/>
                                Add Tab
                            </Button>
                        </div>

                        <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">
                            {tabFields.length === 0 ? (
                                <div
                                    className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                                    <div className="text-center space-y-2">
                                        <p className="text-muted-foreground">No tabs yet. Click "Add Tab" to get
                                            started.</p>
                                    </div>
                                </div>
                            ) : (
                                tabFields.map((tabField, tabIndex) => {
                                    const tabName = form.watch(`tabs.${tabIndex}.name`);
                                    const isCollapsed = collapsedTabs.has(tabField.id); // Collapsed by default
                                    const displayTitle = _.startCase(tabName?.trim() || `Tab ${tabIndex + 1}`);

                                    return (
                                        <Card key={tabField.id} className="border-2">
                                            <CardHeader
                                                className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => {
                                                    const newCollapsed = new Set(collapsedTabs);
                                                    if (isCollapsed) {
                                                        // Expand: remove from collapsed set
                                                        newCollapsed.delete(tabField.id);
                                                    } else {
                                                        // Collapse: add to collapsed set
                                                        newCollapsed.add(tabField.id);
                                                    }
                                                    setCollapsedTabs(newCollapsed);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-lg">
                                                            {displayTitle}
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newCollapsed = new Set(collapsedTabs);
                                                                if (isCollapsed) {
                                                                    // Expand: remove from collapsed set
                                                                    newCollapsed.delete(tabField.id);
                                                                } else {
                                                                    // Collapse: add to collapsed set
                                                                    newCollapsed.add(tabField.id);
                                                                }
                                                                setCollapsedTabs(newCollapsed);
                                                            }}
                                                        >
                                                            {isCollapsed ? (
                                                                <ChevronDown className="h-4 w-4"/>
                                                            ) : (
                                                                <ChevronUp className="h-4 w-4"/>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tabFields.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeTab(tabIndex);
                                                                }}
                                                                className="text-destructive hover:text-destructive cursor-pointer"
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            {!isCollapsed && (
                                                <CardContent className="space-y-4">
                                                    {/* Tab Name */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`tabs.${tabIndex}.name`}
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Tab Name <span className="text-destructive">*</span>
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        className="bg-background"
                                                                        placeholder="e.g., User Information"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Columns Section */}
                                                    <div className="space-y-3 pt-2 border-t">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-medium">
                                                                Columns
                                                            </Label>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    const currentColumns = form.getValues(`tabs.${tabIndex}.columns`) || [];
                                                                    form.setValue(`tabs.${tabIndex}.columns`, [
                                                                        ...currentColumns,
                                                                        {name: "", isReward: false},
                                                                    ]);
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3"/>
                                                                Add Column
                                                            </Button>
                                                        </div>

                                                        <TabColumnsField
                                                            form={form}
                                                            tabIndex={tabIndex}
                                                        />
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 shrink-0">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="cursor-pointer"
                        >
                            {isSubmitting && <Spinner/>}
                            {isSubmitting ? "Saving..." : "Save Schema"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

function TabColumnsField({form, tabIndex}: { form: ReturnType<typeof useForm<FormData>>; tabIndex: number }) {
    const {fields: columnFields, remove: removeColumn} = useFieldArray({
        control: form.control,
        name: `tabs.${tabIndex}.columns` as const,
    });

    if (columnFields.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                No columns yet. Click "Add Column" to add one.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {columnFields.map((columnField, columnIndex) => (
                <Card key={columnField.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                                <FormField
                                    control={form.control}
                                    name={`tabs.${tabIndex}.columns.${columnIndex}.name`}
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel className="text-sm">
                                                Column Name <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-background"
                                                    placeholder="e.g., email, user_id"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`tabs.${tabIndex}.columns.${columnIndex}.isReward`}
                                    render={({field}) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value as boolean || false}
                                                    onCheckedChange={field.onChange}
                                                    className="cursor-pointer"
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal cursor-pointer">
                                                Is Reward Column
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeColumn(columnIndex)}
                                className="text-destructive hover:text-destructive cursor-pointer mt-8"
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
