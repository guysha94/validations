"use client";
import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import SelectIcon from "~/components/SelectIcon";
import {DialogClose, DialogFooter} from "~/components/ui/dialog";
import {eventsCollection} from "~/db/collections";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import { useRouter } from 'next/navigation'


const formSchema = z.object({
    type: z.string().min(2, {message: "Event type is required"}),
    title: z.string(),
    icon: z.string(),
});

export default function NewEventForm() {

    const router = useRouter();
    const {toggleAddFormOpen} = useValidationsStore(useShallow((state) => state));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            type: "",
            title: "",
            icon: "",
        },
    });

    const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
        const tx = eventsCollection.insert({
            ...data,
            label:data.title,
            id: "",

        });
        toggleAddFormOpen();
        await tx.isPersisted.promise;
        router.push(`/events/${data.type}`.toLowerCase());
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="type"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., PresetsConfigChange" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel> Title </FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Presets Config Change" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="icon"
                    render={({field}) => (
                        <FormItem>
                            <SelectIcon field={field}/>
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="cursor-pointer">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" className="cursor-pointer">Submit</Button>

                </DialogFooter>
            </form>
        </Form>


    )
}
