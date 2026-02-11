"use client";

import {useCallback, useState, useTransition} from "react";
import {authClient} from "~/lib/auth/client";
import {Button} from "~/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {toast} from "sonner";
import {Pencil, Plus, Trash2} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";

type Team = {
    id: string;
    name: string;
    organizationId: string;
    createdAt: Date | string;
    updatedAt?: Date | string | null;
};

export function TeamsManager({organizationId, initialTeams}: { organizationId: string, initialTeams: Team[] }) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [newName, setNewName] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const createTeam = useCallback(() => {
        if (!newName.trim()) return;
        startTransition(async () => {
            try {
                const res = await authClient.organization.createTeam({
                    organizationId,
                    name: newName.trim(),
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to create team");
                    return;
                }
                if (res.data) {
                    setTeams((prev) => [...prev, res.data as Team]);
                    setNewName("");
                    setCreateOpen(false);
                    toast.success("Team created");
                }
            } catch (e) {
                toast.error("Failed to create team");
                console.error(e);
            }
        });
    }, [organizationId, newName, setTeams, setNewName, setCreateOpen]);

    const updateTeam = useCallback((teamId: string) => {
        if (!editName.trim()) return;
        startTransition(async () => {
            try {
                const res = await authClient.organization.updateTeam({
                    teamId,
                    data: {
                        organizationId,
                        name: editName.trim()
                    }
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to update team");
                    return;
                }
                if (res.data) {
                    setTeams((prev) =>
                        prev.map((t) => (t.id === teamId ? {...t, ...res.data} : t))
                    );
                    setEditId(null);
                    setEditName("");
                    toast.success("Team updated");
                }
            } catch (e) {
                toast.error("Failed to update team");
                console.error(e);
            }
        });
    }, [organizationId, editName, setTeams, setEditId, setEditName]);

    const removeTeam = useCallback((teamId: string) => {
        startTransition(async () => {
            try {
                const res = await authClient.organization.removeTeam({
                    teamId,
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to delete team");
                    return;
                }
                setTeams((prev) => prev.filter((t) => t.id !== teamId));
                setDeleteId(null);
                toast.success("Team deleted");
            } catch (e) {
                toast.error("Failed to delete team");
                console.error(e);
            }
        });
    }, [setTeams, setDeleteId]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Teams</CardTitle>
                        <CardDescription>
                            Add or remove teams for your organization.
                        </CardDescription>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="size-4"/>
                                Add team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New team</DialogTitle>
                                <DialogDescription>
                                    Create a new team in your organization.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-2 py-4">
                                <Label htmlFor="new-team-name">Team name</Label>
                                <Input
                                    id="new-team-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Engineering"
                                    onKeyDown={(e) => e.key === "Enter" && createTeam()}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateOpen(false)}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={createTeam} disabled={isPending || !newName.trim()}>
                                    {isPending ? "Creating…" : "Create"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No teams yet. Add one above.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {teams.map((team) => (
                                <li
                                    key={team.id}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    {editId === team.id ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") updateTeam(team.id);
                                                    if (e.key === "Escape") {
                                                        setEditId(null);
                                                        setEditName("");
                                                    }
                                                }}
                                                className="h-8"
                                                autoFocus
                                            />
                                            <Button
                                                size="xs"
                                                onClick={() => updateTeam(team.id)}
                                                disabled={isPending || !editName.trim()}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditId(null);
                                                    setEditName("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium">{team.name}</span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditId(team.id);
                                                        setEditName(team.name);
                                                    }}
                                                    aria-label="Edit team"
                                                >
                                                    <Pencil className="size-3.5"/>
                                                </Button>
                                                <Dialog
                                                    open={deleteId === team.id}
                                                    onOpenChange={(open) => setDeleteId(open ? team.id : null)}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="icon-xs"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            aria-label="Delete team"
                                                        >
                                                            <Trash2 className="size-3.5"/>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Delete team</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to delete &quot;{team.name}&quot;?
                                                                This cannot be undone.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setDeleteId(null)}
                                                                disabled={isPending}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => removeTeam(team.id)}
                                                                disabled={isPending}
                                                            >
                                                                {isPending ? "Deleting…" : "Delete"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
