"use client";

import {useCallback, useRef, useState} from "react";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Optional, SelectEvent} from "~/domain";
import {useUserInfoStore, useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import * as Icons from "lucide-react";
import {BadgeQuestionMark, Download, EllipsisVertical, type LucideIcon, Pencil, Plus, Trash2, Upload} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {useParams, useRouter} from "next/navigation";
import dynamic from "next/dynamic";
import Loader from "~/components/Loader";
import {eq, useLiveQuery} from "@tanstack/react-db";
import {eventsCollection} from "~/lib/db/collections";
import {Skeleton} from "~/components/ui/skeleton";
import {getQueryClient} from "~/lib/query-client";
import {toast} from "sonner";
import Papa from "papaparse";
import {api} from "~/lib/api";
import {useAuth} from "~/hooks/useAuth";

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function NavMainComponent({
                                     teamId,
                                 }: {
    teamId: string;
}) {

    const {slug} = useParams();
    const router = useRouter();
    const {user} = useAuth();
    const {toggleAddFormOpen, setCurrentEvent} = useValidationsStore(useShallow((state) => state));
    const {activeTeam} = useUserInfoStore(useShallow((state) => state));
    const {data: events = [], isLoading: isLoadingEvents} = useLiveQuery(
        (q) => q.from({events: eventsCollection})
            .where(({events}) => eq(events.teamId, teamId)),
    );
    const importFileRef = useRef<HTMLInputElement>(null);

    const [renameEvent, setRenameEvent] = useState<SelectEvent | null>(null);
    const [renameLabel, setRenameLabel] = useState("");
    const [deleteEvent, setDeleteEvent] = useState<SelectEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const onSelectedEvent = useCallback((eventType: Optional<SelectEvent>) => {
        setCurrentEvent(eventType);
        if (eventType) {
            router.push(`/${activeTeam!.slug}/events/${eventType.type.toLowerCase()}`);
        }
    }, [setCurrentEvent, router, activeTeam]);

    const openRename = useCallback((event: SelectEvent) => {
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
            const slug = renameEvent.type?.toLowerCase() ?? String(renameEvent.id);
            const res = await fetch(`${typeof window !== "undefined" ? window.location.origin : ""}/api/events/${encodeURIComponent(slug)}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({label: renameLabel.trim()}),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error((data as { error?: string }).error ?? "Failed to rename");
                return;
            }
            toast.success("Event renamed");
            getQueryClient().invalidateQueries({queryKey: ["events"]});
            closeRename();
            router.refresh();
        } catch {
            toast.error("Failed to rename");
        } finally {
            setIsSubmitting(false);
        }
    }, [renameEvent, renameLabel, closeRename, router]);

    const openDelete = useCallback((event: SelectEvent) => setDeleteEvent(event), []);
    const closeDelete = useCallback(() => setDeleteEvent(null), []);

    const handleDelete = useCallback(async () => {
        if (!deleteEvent) return;
        setIsSubmitting(true);
        try {
            const slug = deleteEvent.type?.toLowerCase() ?? String(deleteEvent.id);
            const base = typeof window !== "undefined" ? window.location.origin : "";
            const res = await fetch(`${base}/api/events/${encodeURIComponent(slug)}`, {method: "DELETE"});
            const data = await res.json();
            if (!res.ok) {
                toast.error((data as { error?: string }).error ?? "Failed to delete");
                return;
            }
            toast.success("Event deleted");
            getQueryClient().invalidateQueries({queryKey: ["events"]});
            closeDelete();
            router.push(`/${activeTeam?.slug ?? ""}`);
            router.refresh();
        } catch {
            toast.error("Failed to delete");
        } finally {
            setIsSubmitting(false);
        }
    }, [deleteEvent, closeDelete, router, activeTeam?.slug]);

    const exportEventToCsv = useCallback((event: SelectEvent) => {
        const schema = (event.eventSchema as Record<string, Array<{ name: string; isReward?: boolean }>>) ?? {};
        const rows: { type: string; label: string; icon: string; editAccess: string; tab: string; column: string; isReward: string }[] = [];
        let first = true;
        for (const [tabName, columns] of Object.entries(schema)) {
            for (const col of columns ?? []) {
                rows.push({
                    type: first ? event.type : "",
                    label: first ? event.label : "",
                    icon: first ? event.icon : "",
                    editAccess: first ? String(event.editAccess ?? "restricted") : "",
                    tab: tabName,
                    column: col.name ?? "",
                    isReward: String(col.isReward ?? false),
                });
                first = false;
            }
        }
        if (rows.length === 0) {
            rows.push({
                type: event.type,
                label: event.label,
                icon: event.icon,
                editAccess: String(event.editAccess ?? "restricted"),
                tab: "",
                column: "",
                isReward: "",
            });
        }
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${event.type}-event.csv`);
        toast.success("Event exported to CSV");
    }, []);

    const exportEventToJson = useCallback((event: SelectEvent) => {
        const payload = {
            type: event.type,
            label: event.label,
            icon: event.icon,
            editAccess: event.editAccess,
            eventSchema: event.eventSchema ?? {},
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${event.type}-event.json`);
        toast.success("Event exported to JSON");
    }, []);

    const handleImportEvents = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeTeam || !user) return;
        e.target.value = "";
        setIsImporting(true);
        try {
            const ext = file.name.split(".").pop()?.toLowerCase();
            const text = await file.text();
            const toCreate: Array<{ type: string; label: string; icon: string; editAccess: string; eventSchema?: Record<string, unknown> }> = [];
            if (ext === "json") {
                const parsed = JSON.parse(text);
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of arr) {
                    toCreate.push({
                        type: item.type ?? item.label ?? "",
                        label: item.label ?? item.type ?? "",
                        icon: item.icon ?? "Activity",
                        editAccess: item.editAccess ?? "restricted",
                        eventSchema: item.eventSchema ?? {},
                    });
                }
            } else if (ext === "csv") {
                const { data } = Papa.parse<Record<string, string>>(text, { header: true });
                const rows = data ?? [];
                let current: { type: string; label: string; icon: string; editAccess: string; schema: Record<string, Array<{ name: string; isReward: boolean }>> } | null = null;
                for (const row of rows) {
                    const type = (row.type ?? row.Type ?? "").trim();
                    const label = (row.label ?? row.Label ?? type).trim();
                    const icon = (row.icon ?? row.Icon ?? "Activity").trim();
                    const editAccess = (row.editAccess ?? row.edit_access ?? "restricted").trim() || "restricted";
                    const tab = (row.tab ?? row.Tab ?? "").trim();
                    const column = (row.column ?? row.Column ?? "").trim();
                    const isReward = (row.isReward ?? row.is_reward ?? "false").toLowerCase() === "true";
                    if (type) {
                        if (current) toCreate.push({ type: current.type, label: current.label || current.type, icon: current.icon, editAccess: current.editAccess, eventSchema: current.schema });
                        current = { type, label, icon, editAccess, schema: {} };
                    }
                    if (tab && column && current) {
                        if (!current.schema[tab]) current.schema[tab] = [];
                        current.schema[tab].push({ name: column, isReward });
                    }
                }
                if (current) toCreate.push({ type: current.type, label: current.label || current.type, icon: current.icon, editAccess: current.editAccess, eventSchema: current.schema });
            } else {
                toast.error("Unsupported format. Use CSV or JSON.");
                return;
            }
            if (toCreate.length === 0) {
                toast.error("No valid events found in file");
                return;
            }
            for (const ev of toCreate) {
                await api.events.create(ev as never);
            }
            toast.success(`Imported ${toCreate.length} event(s)`);
            getQueryClient().invalidateQueries({ queryKey: ["events"] });
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
            setIsImporting(false);
        }
    }, [activeTeam, user, router]);

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent className="flex flex-col gap-2">

                    <SidebarMenu>
                        <div className="flex flex-col gap-1">
                            <SidebarMenuItem className="cursor-pointer" onClick={toggleAddFormOpen}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start cursor-pointer"
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
                                    onChange={handleImportEvents}
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
                        {isLoadingEvents && (
                            <Skeleton className="h-10 w-full rounded-md"/>
                        )}
                        {!!events?.length && events?.map((item) => (
                            <SidebarMenuItem key={item.id} className="flex items-center gap-0">
                                <SidebarMenuButton
                                    className="cursor-pointer flex-1 min-w-0"
                                    tooltip={item.label || item.type}
                                    isActive={slug?.includes(item.type.toLowerCase())}
                                    onClick={() => onSelectedEvent(item as SelectEvent)}
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
                                                openRename(item as SelectEvent);
                                            }}
                                        >
                                            <Pencil className="mr-2 size-4"/>
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                exportEventToCsv(item as SelectEvent);
                                            }}
                                        >
                                            <Download className="mr-2 size-4"/>
                                            Export to CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                exportEventToJson(item as SelectEvent);
                                            }}
                                        >
                                            <Download className="mr-2 size-4"/>
                                            Export to JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer text-destructive focus:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDelete(item as SelectEvent);
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

            <Dialog open={!!renameEvent} onOpenChange={(open) => !open && closeRename()}>
                <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
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
                        <Button variant="outline" onClick={closeRename} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleRename} disabled={isSubmitting || !renameLabel.trim()}>
                            {isSubmitting ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteEvent} onOpenChange={(open) => !open && closeDelete()}>
                <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Delete event</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Delete &quot;{deleteEvent?.label ?? deleteEvent?.type}&quot;? All rules for this event will be
                        removed. This cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDelete} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

const DynamicIcon = ({icon}: { icon: string }) => {
    const IconComponent = (Icons[icon as keyof typeof Icons] || BadgeQuestionMark) as unknown as LucideIcon;
    return <IconComponent className="size-4"/>;
}

export const NavMain = dynamic(() => Promise.resolve(NavMainComponent), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default NavMain;