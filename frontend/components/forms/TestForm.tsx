"use client";

import {useForm} from "react-hook-form";
import {useState} from "react";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {api} from "~/lib";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import {Spinner} from "~/components/ui/spinner";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {toast} from "sonner";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";


const formSchema = z.object({
    url: z.url({message: "Invalid URL format"}),
});

type FormData = z.infer<typeof formSchema>;

export default function TestForm() {
    const {currentEvent} = useValidationsStore(useShallow((state) => state));
    const [isSubmitting, setIsSubmitting] = useState(false);


    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: "https://docs.google.com/spreadsheets/d/",
        },
    });

    const onSubmit = async ({url}: FormData) => {
        if(!currentEvent) return;
        setIsSubmitting(true);

        try {

            const response = await api.validations.validate({eventType: currentEvent.type, url});
            console.log("Validation response:", response);
            setTestResultsAction(response.errors?.map((error: any, index: number) => ({index: index + 1, ...error})) || []);

            if (response.errors && response.errors.length > 0) {
                toast.error(`Validation failed with ${response.errors.length} error(s)`, {
                    closeButton: true,
                    duration: 4000,
                    style: {backgroundColor: "#f43f5e", color: "white"},
                });
            } else {
                toast.success("Validation passed successfully!", {
                    closeButton: true,
                    duration: 4000,
                    richColors: true,
                    style: {backgroundColor: "#4ade80", color: "white"},
                });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred during validation", {
                closeButton: true,
                duration: 4000,
                style: {backgroundColor: "#f43f5e", color: "white"},
            });
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
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>
                                        URL <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            className="bg-background"
                                            placeholder="https://example.com/spreadsheet"
                                            type="url"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="cursor-pointer"
                            >
                                {isSubmitting && <Spinner/>}
                                {isSubmitting ? "Validating..." : "Validate"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
