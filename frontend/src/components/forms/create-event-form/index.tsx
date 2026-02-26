"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { IconName } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { IconPicker } from "~/components/ui/icon-picker";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Team } from "~/domain";
import { defaultValues, type EventFormValues, schema } from "./schema";

type Props = {
  team: Team;
  toggleDialog: () => void;
};

export function NewEventForm({ team: _team, toggleDialog }: Props) {
  const _router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(schema as any),
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = useCallback(
    (_values: EventFormValues) => {
      toggleDialog();
    },
    [toggleDialog],
  );

  const onReset = useCallback(() => {
    form.reset();
    form.clearErrors();
  }, [form]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onReset={onReset}
      className="space-y-8 @container"
    >
      <div className="grid grid-cols-12 gap-4">
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field
              className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Title</FieldLabel>

              <Input
                key="title"
                placeholder=""
                type="text"
                className=""
                {...field}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <Field
              className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Type</FieldLabel>

              <Input
                key="type"
                placeholder=""
                type="text"
                className=""
                {...field}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="icon"
          render={({ field, fieldState }) => (
            <Field
              className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Icon</FieldLabel>
              <IconPicker
                value={field.value as IconName}
                onValueChange={(name) => field.onChange(name)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="editAccess"
          render={({ field, fieldState }) => (
            <Field
              className="col-span-12 col-start-auto flex self-end flex-col gap-2 space-y-0 items-start"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel className="flex w-auto!">Edit Access</FieldLabel>

              <Select
                key="editAccess"
                value={field.value}
                name={field.name}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full ">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="public" value="public">
                    Public
                  </SelectItem>

                  <SelectItem key="restricted" value="restricted">
                    Restricted
                  </SelectItem>
                </SelectContent>
              </Select>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </form>
  );
}

export default NewEventForm;
