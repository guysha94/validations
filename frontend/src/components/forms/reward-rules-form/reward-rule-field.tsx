import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  type FieldArrayWithId,
  type UseFormReturn,
  useFieldArray,
} from "react-hook-form";
import SQLEditor from "~/components/sql-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { RewardRuleFormData } from "./schema";

type RewardRule = RewardRuleFormData & { id?: string };

export type EventSchema = Record<
  string,
  Array<{ name: string; isReward?: boolean }>
>;

type Props = {
  ruleField:
    | FieldArrayWithId<RewardRule>
    | (RewardRuleFormData & { id: string });
  index: number;
  readOnly: boolean;
  form: UseFormReturn<{ rules: RewardRule[] }>;
  fields: readonly { id: string }[];
  eventSchema: EventSchema;
  toggleRuleEnabled: (index: number) => void;
  onRemove: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function RewardRuleField({
  ruleField,
  index,
  form,
  readOnly,
  onRemove,
  fields,
  eventSchema,
  toggleRuleEnabled,
  isCollapsed,
  onToggleCollapse,
}: Props) {
  const {
    fields: queryFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: `rules.${index}.queries` as any,
  });

  const ruleName = form.watch(`rules.${index}.name`);
  const displayTitle = ruleName?.trim() || `Rule ${index + 1}`;

  const tabNames = Object.keys(eventSchema ?? {});
  const selectedTab = form.watch(`rules.${index}.tab`);
  const columns = eventSchema?.[selectedTab ?? ""] ?? [];
  const columnNames = columns.map((c) =>
    typeof c === "string" ? c : (c as { name: string }).name,
  );

  return (
    <Card
      key={ruleField.id}
      className="has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
    >
      <CardHeader
        aria-checked={
          form.getValues(`rules.${index}.enabled`) ? "true" : "false"
        }
        tabIndex={readOnly ? undefined : 0}
        role="checkbox"
        className={`pb-4 ${readOnly ? "" : "cursor-pointer"} hover:bg-muted/50 transition-colors`}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{displayTitle}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-pointer shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex" onClick={(e) => e.stopPropagation()}>
            <FormField
              control={form.control}
              name={`rules.${index}.enabled`}
              render={({ field }) => (
                <FormItem className="flex flex-row-reverse items-center space-x-1 space-y-0 mr-4">
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
                      checked={
                        (typeof field?.value === "undefined"
                          ? true
                          : field.value) as boolean
                      }
                      onBlur={() => field.onBlur()}
                      onClick={() => toggleRuleEnabled(index)}
                      disabled={readOnly}
                      className="cursor-pointer data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!readOnly && fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
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
          <FormField
            control={form.control}
            name={`rules.${index}.name`}
            rules={{ required: "Rule name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background"
                    placeholder="e.g., Visuals validation"
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
            name={`rules.${index}.tab`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue(`rules.${index}.column`, "", {
                      shouldValidate: true,
                    });
                  }}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select tab" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tabNames.map((tab) => (
                      <SelectItem
                        key={tab}
                        value={tab}
                        className="cursor-pointer"
                      >
                        {tab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`rules.${index}.column`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Column</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={readOnly || !selectedTab}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {columnNames.map((col) => (
                      <SelectItem
                        key={col}
                        value={col}
                        className="cursor-pointer"
                      >
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FormLabel>
                Queries <span className="text-destructive">*</span>
              </FormLabel>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      query: "",
                      errorMessage: "",
                      description: "",
                    })
                  }
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Query
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {queryFields.map((qf, qIdx) => {
                const queryDescription =
                  form.watch(`rules.${index}.queries.${qIdx}.description`) ??
                  "";
                const hasEnoughDescription =
                  queryDescription.trim().length >= 15;
                return (
                  <div key={qf.id} className="space-y-2 rounded-lg border p-3">
                    <FormField
                      control={form.control}
                      name={`rules.${index}.queries.${qIdx}.query`}
                      rules={{ required: "Query is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>SQL Query</FormLabel>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={!hasEnoughDescription || readOnly}
                                    className="cursor-pointer"
                                  >
                                    <Sparkles className="h-4 w-4" />
                                    Generate query with AI
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasEnoughDescription
                                  ? "Not implemented yet"
                                  : "Fill in the description (at least a short sentence) to enable AI query generation"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <FormControl>
                            <SQLEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="SELECT * FROM ..."
                              readOnly={readOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`rules.${index}.queries.${qIdx}.errorMessage`}
                        rules={{ required: "Error message is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Error Message{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-background"
                                placeholder="e.g., Invalid reward type"
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
                        name={`rules.${index}.queries.${qIdx}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-background"
                                placeholder="Optional description"
                                readOnly={readOnly}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {!readOnly && queryFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(qIdx)}
                        className="text-destructive hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
