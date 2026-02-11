"use client";

import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {useState} from "react";
import _ from "lodash";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import SelectIcon from "~/components/SelectIcon";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "~/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {toast} from "sonner";
import type {SelectEvent} from "~/domain";
import {EventsSchema} from "~/lib/db/schemas";
import {eventsCollection} from "~/lib/db/collections";
import {ROOT_ROUTE} from "~/lib/constants";
import {useUserInfoStore} from "~/store";
import {useShallow} from "zustand/react/shallow";

const formSchema = z.object({
    type: z.string().min(2, {message: "Event type is required"}),
    label: z.string().min(1, {message: "Title is required"}),
    icon: z.string().min(1, {message: "Icon is required"}),
    editAccess: z.enum(["public", "restricted"]),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
    event: SelectEvent | EventsSchema;
    slug: string;
};

export default function EventSettingsForm({event, slug}: Props) {
    const router = useRouter();
    const {activeTeam} = useUserInfoStore(useShallow((state) => state));
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            type: event.type ?? "",
            label: event.label ?? "",
            icon: event.icon ?? "FileQuestion",
            editAccess: (event as { editAccess?: string }).editAccess === "public" ? "public" : "restricted",
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await fetch(`${typeof window !== "undefined" ? window.location.origin : ""}/api/events/${encodeURIComponent(slug)}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    type: data.type,
                    label: data.label,
                    icon: data.icon,
                    editAccess: data.editAccess,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.error ?? "Failed to update event");
                return;
            }
            toast.success("Event updated");
            const newSlug = data.type?.toLowerCase();
            if (newSlug && newSlug !== slug.toLowerCase()) {
                router.replace(`/events/${newSlug}`);
            } else {
                router.refresh();
            }
        } catch (e) {
            toast.error("Failed to update event");
        }
    };

    const onDelete = async () => {
        setIsDeleting(true);
        try {
            const tx = eventsCollection.delete(event.id, {optimistic: true});
            await tx.isPersisted.promise;
           
            toast.success("Event deleted");
            setDeleteOpen(false);
            router.refresh();
            router.push(`${ROOT_ROUTE}${activeTeam!.slug}`);
        } catch {
            toast.error("Failed to delete event");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event settings</CardTitle>
                <CardDescription>Edit name, title, icon, and who can edit this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Event type (identifier)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., PresetsConfigChange"
                                            {...field}
                                            onInput={(e) => {
                                                const value = (e.target as HTMLInputElement).value.replace(/\s+/g, "");
                                                field.onChange(value);
                                                form.setValue("label", _.startCase(value), {shouldDirty: true});
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="label"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
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
                                    <FormLabel>Icon</FormLabel>
                                    <FormControl>
                                        <SelectIcon field={field}/>
                                    </FormControl>
                                    <FormMessage/>
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
                                            onChange={(e) =>
                                                field.onChange(e.target.value as "public" | "restricted")
                                            }
                                        >
                                            <option value="restricted">Only me and admins</option>
                                            <option value="public">Any team member</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="cursor-pointer">
                            Save changes
                        </Button>
                    </form>
                </Form>

                <div className="border-t pt-6">
                    <p className="text-sm text-muted-foreground mb-2">Delete this event and all its rules. This cannot
                        be undone.</p>
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="cursor-pointer">
                                Delete event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete event</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete &quot;{event.label ?? event.type}&quot;? All rules
                                    for this event will be removed. This cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => setDeleteOpen(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="cursor-pointer"
                                    onClick={onDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting…" : "Delete"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
