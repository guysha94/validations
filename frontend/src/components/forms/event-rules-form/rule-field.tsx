import { ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { EventRule } from "~/domain";
import type { EventRuleFormData } from "./schema";

type Props = {
  ruleField: FieldArrayWithId<EventRule>;
  index: number;
  readOnly: boolean;
  form: UseFormReturn<{ rules: EventRuleFormData[] }>;
  fields: FieldArrayWithId<EventRule>[];
  toggleRuleEnabled: (index: number) => void;
  onRemove: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function RuleField({
  ruleField,
  index,
  form,
  readOnly,
  onRemove,
  fields,
  toggleRuleEnabled,
  isCollapsed,
  onToggleCollapse,
}: Props) {
  const ruleName = form.watch(`rules.${index}.name`);
  const displayTitle = ruleName?.trim() || `Rule ${index + 1}`;
  const description = form.watch(`rules.${index}.description`) ?? "";
  const hasEnoughDescription = description.trim().length >= 15;

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
                    placeholder="e.g., email_format_check"
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
            name={`rules.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    className="bg-background"
                    placeholder="e.g., email_format_check"
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
            name={`rules.${index}.errorMessage`}
            rules={{ required: "Error message is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Error Message <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background"
                    placeholder="e.g., Invalid email format"
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
            name={`rules.${index}.query`}
            rules={{ required: "Query is required" }}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    Query <span className="text-destructive">*</span>
                  </FormLabel>
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
                    placeholder="e.g., email LIKE '%@%.%'"
                    readOnly={readOnly}
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
}

export default RuleField;
