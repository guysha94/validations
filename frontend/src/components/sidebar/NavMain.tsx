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
import Papa from "papaparse";
import {type ChangeEvent, useCallback, useRef, useState} from "react";
import {toast} from "sonner";
import {uuidv7} from "uuidv7";
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
import {useAuth, useEvents} from "~/hooks";
import {isNewEventDialogOpen} from "~/lib/signals";
import {getEventRoute, slugify} from "~/lib/utils";
import dynamic from "next/dynamic";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function NavMainComponent() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, activeTeam } = useAuth();

  const { events, isPending } = useEvents();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [renameEvent, setRenameEvent] = useState<Event | null>(null);
  const [renameLabel, setRenameLabel] = useState("");
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const toggleAddFormOpen = useCallback(() => {
    isNewEventDialogOpen.value = !isNewEventDialogOpen.value;
  }, []);

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

  const openDelete = useCallback((event: Event) => setDeleteEvent(event), []);
  const closeDelete = useCallback(() => setDeleteEvent(null), []);

  const handleDelete = useCallback(async () => {
    if (!deleteEvent) return;
    setIsSubmitting(true);
    try {
      toast.success("Event deleted");
      closeDelete();
      router.push(`/${activeTeam?.slug}`);
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteEvent, closeDelete, router, activeTeam]);

  const exportEventToCsv = useCallback((event: Event) => {
    const schema =
      (event.eventSchema as Record<
        string,
        Array<{ name: string; isReward?: boolean }>
      >) ?? {};
    const rows: {
      type: string;
      label: string;
      icon: string;
      editAccess: string;
      tab: string;
      column: string;
      isReward: string;
    }[] = [];
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

  const exportEventToJson = useCallback((event: Event) => {
    const payload = {
      type: event.type,
      label: event.label,
      icon: event.icon,
      editAccess: event.editAccess,
      eventSchema: event.eventSchema ?? {},
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `${event.type}-event.json`);
    toast.success("Event exported to JSON");
  }, []);

  const handleImportEvents = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeTeam || !user) return;
      e.target.value = "";
      setIsImporting(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const text = await file.text();
        const toCreate: Array<Event> = [];
        if (ext === "json") {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of arr) {
            toCreate.push({
              id: item.id ?? uuidv7(),
              type: item.type ?? item.label ?? "",
              label: item.label ?? item.type ?? "",
              icon: item.icon ?? "Activity",
              editAccess: item.editAccess ?? "restricted",
              eventSchema: item.eventSchema ?? {},
              createdById: user.id,
              teamId: activeTeam.id,
              updatedAt: new Date(),
            });
          }
        } else if (ext === "csv") {
          const { data } = Papa.parse<Record<string, string>>(text, {
            header: true,
          });
          const rows = data ?? [];
          let current: {
            type: string;
            label: string;
            icon: string;
            editAccess: string;
            schema: Record<string, Array<{ name: string; isReward: boolean }>>;
          } | null = null;
          for (const row of rows) {
            const type = (row.type ?? row.Type ?? "").trim();
            const label = (row.label ?? row.Label ?? type).trim();
            const icon = (row.icon ?? row.Icon ?? "Activity").trim();
            const editAccess =
              (row.editAccess ?? row.edit_access ?? "restricted").trim() ||
              "restricted";
            const tab = (row.tab ?? row.Tab ?? "").trim();
            const column = (row.column ?? row.Column ?? "").trim();
            const isReward =
              (row.isReward ?? row.is_reward ?? "false").toLowerCase() ===
              "true";
            if (type) {
              if (current)
                toCreate.push({
                  id: row.id ?? uuidv7(),
                  type: current.type,
                  label: current.label || current.type,
                  icon: current.icon,
                  editAccess: current.editAccess,
                  eventSchema: current.schema,
                  createdById: user.id,
                  teamId: activeTeam.id,
                  updatedAt: new Date(),
                });
              current = { type, label, icon, editAccess, schema: {} };
            }
            if (tab && column && current) {
              if (!current.schema[tab]) current.schema[tab] = [];
              current.schema[tab].push({ name: column, isReward });
            }
          }
          if (current)
            toCreate.push({
              id: current.type
                ? (rows.find(
                    (r) => (r.type ?? r.Type ?? "").trim() === current?.type,
                  )?.id ?? uuidv7())
                : uuidv7(),
              type: current.type,
              label: current.label || current.type,
              icon: current.icon,
              editAccess: current.editAccess,
              eventSchema: current.schema,
              createdById: user.id,
              teamId: activeTeam.id,
              updatedAt: new Date(),
            });
        } else {
          toast.error("Unsupported format. Use CSV or JSON.");
          return;
        }
        if (toCreate.length === 0) {
          toast.error("No valid events found in file");
          return;
        }

        toast.success(`Imported ${toCreate.length} event(s)`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        setIsImporting(false);
      }
    },
    [activeTeam, user, router],
  );

  if (isPending || !activeTeam) {
    return <Loader fullscreen />;
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
                  onClick={toggleAddFormOpen}
                >
                  <Plus />
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
                  <Upload className="size-4" />
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
                    <DynamicIcon icon={item.icon} />
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
                        <EllipsisVertical className="size-4" />
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
                        <Pencil className="mr-2 size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportEventToCsv(item as Event);
                        }}
                      >
                        <Download className="mr-2 size-4" />
                        Export to CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportEventToJson(item as Event);
                        }}
                      >
                        <Download className="mr-2 size-4" />
                        Export to JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(item as Event);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
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
        open={!!deleteEvent}
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
            Delete &quot;{deleteEvent?.label ?? deleteEvent?.type}&quot;? All
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

const DynamicIcon = ({ icon }: { icon: string }) => {
  const IconComponent = (Icons[icon as keyof typeof Icons] ||
    BadgeQuestionMark) as unknown as LucideIcon;
  return <IconComponent className="size-4" />;
};

export const NavMain = dynamic(() => Promise.resolve(NavMainComponent), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default NavMain;
