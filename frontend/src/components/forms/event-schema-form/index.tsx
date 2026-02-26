"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Tag } from "emblor";
import _ from "lodash";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import Loader from "~/components/Loader";
import { TagInput } from "~/components/tag-input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { useEvents } from "~/hooks";
import { type FormData, formSchema } from "./schema";

type Props = {
  readOnly?: boolean | undefined;
};

export function SchemaForm({ readOnly = false }: Props) {
  const { activeEvent, isLoading, updateEventSchema } = useEvents();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedTabs, setCollapsedTabs] = useState<Set<string>>(new Set());

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    mode: "onChange",
    defaultValues: {
      tabs:
        !!activeEvent?.eventSchema &&
        Object.keys(activeEvent.eventSchema)?.length > 0
          ? (Object.entries(activeEvent.eventSchema)
              .map(([name, columns]) => ({
                name,
                columns,
              }))
              .sort((a, b) => a.name.localeCompare(b.name)) as FormData["tabs"])
          : [],
    },
  });

  const {
    fields: tabFields,
    append: appendTab,
    remove: removeTab,
  } = useFieldArray({
    control: form.control,
    name: "tabs",
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (readOnly) return;
    setIsSubmitting(true);

    try {
      const schemaObj = Object.fromEntries(
        data.tabs.map((tab) => [tab.name, tab.columns]),
      );

      const { data: success, error } = await updateEventSchema(schemaObj);

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
        toast.success("Schema saved successfully", {
          closeButton: true,
          duration: 4000,
          richColors: true,
          style: { backgroundColor: "#4ade80", color: "white" },
        });
      }

      setIsSubmitting(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred",
        {
          closeButton: true,
          duration: 4000,
          style: { backgroundColor: "#f43f5e", color: "white" },
        },
      );
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapse all tabs by default (add new tabs to collapsed set)
  useEffect(() => {
    if (tabFields.length > 0) {
      const allTabIds = new Set(tabFields.map((field) => field.id));

      setCollapsedTabs((prevCollapsed) => {
        const currentCollapsed = new Set(prevCollapsed);
        let hasChanges = false;

        // Add any new tabs to collapsed set (they're collapsed by default)
        allTabIds.forEach((id) => {
          if (!currentCollapsed.has(id)) {
            currentCollapsed.add(id);
            hasChanges = true;
          }
        });

        // Remove tabs that no longer exist
        prevCollapsed.forEach((id) => {
          if (!allTabIds.has(id)) {
            currentCollapsed.delete(id);
            hasChanges = true;
          }
        });

        // Only return new set if there are changes to avoid unnecessary re-renders
        return hasChanges ? currentCollapsed : prevCollapsed;
      });
    }
  }, [tabFields.length, tabFields.map]); // Use tab IDs as dependency instead of the whole array

  useEffect(() => {
    if (!!activeEvent && !form.getValues("tabs")?.length) {
      const initialTabs = Object.entries(activeEvent.eventSchema || {}).map(
        ([name, columns]) => ({
          name,
          columns,
        }),
      );
      form.reset({ tabs: initialTabs as FormData["tabs"] });
    }
  }, [activeEvent, form.getValues, form.reset]);

  if (isLoading) return <Loader fullscreen />;

  if (!activeEvent) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">
          Please select an event to configure its schema.
        </p>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col min-h-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full space-y-6 w-full"
        >
          <div className="flex flex-col flex-1 space-y-4 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <Label>
                Schema Tabs <span className="text-destructive">*</span>
              </Label>
              {!readOnly && (
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
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Tab
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">
              {tabFields.length === 0 ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      No tabs yet. Click &#34;Add Tab&#34; to get started.
                    </p>
                  </div>
                </div>
              ) : (
                tabFields.map((tabField, tabIndex) => {
                  const tabName = form.watch(`tabs.${tabIndex}.name`);
                  const isCollapsed = collapsedTabs.has(tabField.id); // Collapsed by default
                  const displayTitle = _.startCase(
                    tabName?.trim() || `Tab ${tabIndex + 1}`,
                  );

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
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            {!readOnly && tabFields.length > 1 && (
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
                                <Trash2 className="h-4 w-4" />
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
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Tab Name{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="bg-background"
                                    placeholder="e.g., User Information"
                                    readOnly={readOnly}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tabs.${tabIndex}.columns`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Columns{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <TagInput
                                    className="bg-background"
                                    placeholder="Type a column name and press Enter"
                                    readOnly={readOnly}
                                    {...field}
                                    setTags={(tags) => {
                                      field.onChange(
                                        (tags as Tag[])?.map((tag) => tag.text),
                                      );
                                    }}
                                    tags={field.value?.map(
                                      (col) =>
                                        ({
                                          id: col.toString(),
                                          text: col.toString(),
                                        }) as Tag,
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center justify-end pt-4 shrink-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting && <Spinner />}
                {isSubmitting ? "Saving..." : "Save Schema"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
