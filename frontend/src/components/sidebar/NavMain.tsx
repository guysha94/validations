"use client";

import * as Icons from "lucide-react";
import {
    BadgeQuestionMark,
    Download,
    EllipsisVertical,
    type LucideIcon,
    Pencil,
    Plus,
    Trash2,
    Upload
} from "lucide-react";
import {useParams, useRouter} from "next/navigation";
import {useCallback, useRef, useState} from "react";
import {toast} from "sonner";
import Loader from "~/components/Loader";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "~/components/ui/dialog";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "~/components/ui/dropdown-menu";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar";
import type {Event, Optional} from "~/domain";
import {useAuth, useEvents, useImportExport} from "~/hooks";
import {isNewEventDialogOpen} from "~/lib/signals";
import {getEventRoute, slugify} from "~/lib/utils";
import dynamic from "next/dynamic";
import {useStore} from "~/store";
import {useShallow} from "zustand/react/shallow";


export function NavMainComponent() {
    const {slug} = useParams();
    const router = useRouter();
    const {activeTeam} = useAuth();

    const {events, isPending, deleteEvent, deleteError} = useEvents();
    const importFileRef = useRef<HTMLInputElement>(null);

    const [renameEvent, setRenameEvent] = useState<Event | null>(null);
    const [renameLabel, setRenameLabel] = useState("");
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toggleIsNewEventDialogOpen } = useStore(useShallow(state => state));

    const {importEvents, exportEvent, isImporting} = useImportExport();

    const onSelectedEvent = useCallback(
        (eventType: Optional<Event>) => {
            if (!!activeTeam && !!eventType) {
                router.push(
                    getEventRoute(slugify(activeTeam.name), slugify(eventType.type)),
                );
            }
        },
        [router, activeTeam],
    );

    const openRename = useCallback((event: Event) => {
        setRenameEvent(event);
        setRenameLabel(event.label ?? event.type);
    }, []);

    const closeRename = useCallback(() => {
        setRenameEvent(null);
        setRenameLabel("");
    }, []);

    const handleRename = useCallback(async () => {
        if (!renameEvent || !renameLabel.trim()) return;
        setIsSubmitting(true);
        try {
            toast.success("Event renamed");

            closeRename();
            router.refresh();
        } catch {
            toast.error("Failed to rename");
        } finally {
            setIsSubmitting(false);
        }
    }, [renameEvent, renameLabel, closeRename, router]);

    const openDelete = useCallback((event: Event) => setEventToDelete(event), []);
    const closeDelete = useCallback(() => setEventToDelete(null), []);

    const handleDelete = useCallback(async () => {
        if (!eventToDelete) return;
        setIsSubmitting(true);
        try {
            const {success} = await deleteEvent(eventToDelete.id);
            if (deleteError || !success) {
                toast.error(deleteError?.message || "Failed to delete");
                return;
            }
            toast.success("Event deleted");
            closeDelete();
            router.push(`/${activeTeam?.slug}`);
            router.refresh();
        } catch {
            toast.error("Failed to delete");
        } finally {
            setIsSubmitting(false);
        }
    }, [eventToDelete, deleteEvent, closeDelete, router, activeTeam]);


    if (isPending || !activeTeam) {
        return <Loader fullscreen/>;
    }

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent className="flex flex-col gap-2">
                    <SidebarMenu>
                        <div className="flex flex-col gap-1">
                            <SidebarMenuItem className="cursor-pointer">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start cursor-pointer"
                                    onClick={toggleIsNewEventDialogOpen}
                                >
                                    <Plus/>
                                    <span>New Event</span>
                                </Button>
                            </SidebarMenuItem>
                            <SidebarMenuItem className="cursor-pointer">
                                <input
                                    ref={importFileRef}
                                    type="file"
                                    accept=".csv,.json"
                                    className="hidden"
                                    onChange={importEvents}
                                />
                                <Button
                                    variant="outline"
                                    className="w-full justify-start cursor-pointer"
                                    disabled={isImporting}
                                    onClick={() => importFileRef.current?.click()}
                                >
                                    <Upload className="size-4"/>
                                    <span>{isImporting ? "Importing…" : "Import Events"}</span>
                                </Button>
                            </SidebarMenuItem>
                        </div>
                        {!!events?.length &&
                            events?.map((item) => (
                                <SidebarMenuItem
                                    key={item.id}
                                    className="flex items-center gap-0"
                                >
                                    <SidebarMenuButton
                                        className="cursor-pointer flex-1 min-w-0"
                                        tooltip={item.label || item.type}
                                        isActive={slug?.includes(item.type.toLowerCase())}
                                        onClick={() => onSelectedEvent(item as Event)}
                                    >
                                        <DynamicIcon icon={item.icon}/>
                                        <span className="truncate">{item.label}</span>
                                    </SidebarMenuButton>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 shrink-0 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <EllipsisVertical className="size-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" side="right">
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRename(item as Event);
                                                }}
                                            >
                                                <Pencil className="mr-2 size-4"/>
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    exportEvent(item as Event, "csv");
                                                }}
                                            >
                                                <Download className="mr-2 size-4"/>
                                                Export to CSV
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    exportEvent(item as Event, "json");
                                                }}
                                            >
                                                <Download className="mr-2 size-4"/>
                                                Export to JSON
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDelete(item as Event);
                                                }}
                                            >
                                                <Trash2 className="mr-2 size-4"/>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <Dialog
                open={!!renameEvent}
                onOpenChange={(open) => !open && closeRename()}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle>Rename event</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="rename-label">Name</Label>
                        <Input
                            id="rename-label"
                            value={renameLabel}
                            onChange={(e) => setRenameLabel(e.target.value)}
                            placeholder="Event name"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeRename}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={isSubmitting || !renameLabel.trim()}
                        >
                            {isSubmitting ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!eventToDelete}
                onOpenChange={(open) => !open && closeDelete()}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle>Delete event</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Delete &quot;{eventToDelete?.label ?? eventToDelete?.type}&quot;? All
                        rules for this event will be removed. This cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeDelete}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

const DynamicIcon = ({icon}: { icon: string }) => {
    const IconComponent = (Icons[icon as keyof typeof Icons] ||
        BadgeQuestionMark) as unknown as LucideIcon;
    return <IconComponent className="size-4"/>;
};

export const NavMain = dynamic(() => Promise.resolve(NavMainComponent), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default NavMain;
