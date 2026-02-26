"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useShallow } from "zustand/react/shallow";
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
import { Spinner } from "~/components/ui/spinner";
import { useAuth, useEvents } from "~/hooks";
import api from "~/lib/api";
import { useStore } from "~/store";

const formSchema = z.object({
  url: z.url({ message: "Invalid URL format" }),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  readOnly?: boolean;
};

export function TestForm({ readOnly = false }: Props) {
  const { activeTeam } = useAuth();
  const { activeEvent } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTestResults } = useStore(useShallow((state) => state));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      url: "https://docs.google.com/spreadsheets/d/",
    },
  });

  const onSubmit = async ({ url }: FormData) => {
    if (!activeEvent || readOnly) return;
    setIsSubmitting(true);

    try {
      const response = await api.validate({
        eventType: activeEvent.type,
        url,
        team: activeTeam?.slug!,
      });

      setTestResults(
        response.errors?.map((error: any, index: number) => ({
          index: index + 1,
          ...error,
        })) || [],
      );

      if (response.errors && response.errors.length > 0) {
        toast.error(
          `Validation failed with ${response.errors.length} error(s)`,
          {
            closeButton: true,
            duration: 4000,
            style: { backgroundColor: "#f43f5e", color: "white" },
          },
        );
      } else {
        toast.success("Validation passed successfully!", {
          closeButton: true,
          duration: 4000,
          richColors: true,
          style: { backgroundColor: "#4ade80", color: "white" },
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during validation",
        {
          closeButton: true,
          duration: 4000,
          style: { backgroundColor: "#f43f5e", color: "white" },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URL <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-background"
                      placeholder="https://example.com/spreadsheet"
                      type="url"
                      readOnly={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!readOnly && (
              <div className="flex items-center justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? "Validating..." : "Validate"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
