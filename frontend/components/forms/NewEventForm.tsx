"use client";
import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import SelectIcon from "~/components/SelectIcon";
import {DialogClose, DialogFooter} from "~/components/ui/dialog";
import {eventsCollection} from "~/lib/db/collections";
import {useUserInfoStore, useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import {useRouter} from 'next/navigation';
import _ from "lodash";
import {useAuth} from "~/hooks/useAuth";


const formSchema = z.object({
    type: z.string().min(2, {message: "Event type is required"}),
    title: z.string(),
    icon: z.string(),
    editAccess: z.enum(["public", "restricted"]),
});

export default function NewEventForm() {

    const router = useRouter();
    const {user} = useAuth();
    const {activeTeam} = useUserInfoStore(useShallow((state) => state));
    const {toggleAddFormOpen} = useValidationsStore(useShallow((state) => state));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            type: "",
            title: "",
            icon: "",
            editAccess: "restricted",
        },
    });

    const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
        const tx = eventsCollection.insert({
            ...data,
            editAccess: data.editAccess.toString(),
            label: data.title,
            id: "",
            teamId: activeTeam!.id,
            eventSchema: {},
            updatedAt: new Date(),
            createdById: user!.id,
        });
        toggleAddFormOpen();
        await tx.isPersisted.promise;
        router.refresh();
        router.push(`${activeTeam!.slug}/events/${data.type}`.toLowerCase());
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
                                <Input placeholder="e.g., PresetsConfigChange" {...field} onInput={(e) => {
                                    const value = (e.target as HTMLInputElement).value;
                                    const formattedValue = value.replace(/\s+/g, "");
                                    field.onChange(formattedValue);
                                    form.setValue("title", _.startCase(value), {shouldDirty: true});
                                }}/>
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
                <FormField
                    control={form.control}
                    name="editAccess"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Who can edit</FormLabel>
                            <FormControl>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value as "public" | "restricted")}
                                >
                                    <option value="restricted">Only me and admins</option>
                                    <option value="public">Any team member</option>
                                </select>
                            </FormControl>
                            <FormMessage/>
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
