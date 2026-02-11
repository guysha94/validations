"use client";

import {useCallback, useState, useTransition} from "react";
import {authClient} from "~/lib/auth/client";
import {Button} from "~/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "~/components/ui/select";
import {toast} from "sonner";
import {Trash2, UserPlus} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {Role} from "~/domain";
import {ROLES} from "~/lib/constants";

const NO_TEAM = "__none__";

type Member = {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date | string;
    user?: { name?: string | null; email?: string | null };
};

type Invitation = {
    id: string;
    email: string;
    role: string | null;
    organizationId: string;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
};


type Team = { id: string; name: string };

export function MembersManager({
                                   organizationId,
                                   initialMembers,
                                   initialInvitations,
                                   initialTeams = [],
                               }: {
    organizationId: string,
    initialMembers: Member[];
    initialInvitations: Invitation[];
    initialTeams?: Team[];
}) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [invitations, setInvitations] =
        useState<Invitation[]>(initialInvitations);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("member");
    const [inviteTeamId, setInviteTeamId] = useState<string>(NO_TEAM);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removeId, setRemoveId] = useState<string | null>(null);
    const [roleEditId, setRoleEditId] = useState<string | null>(null);
    const [roleValue, setRoleValue] = useState("");
    const [isPending, startTransition] = useTransition();

    const inviteMember = useCallback(() => {
        if (!inviteEmail.trim()) return;
        startTransition(async () => {
            try {
                const res = await authClient.organization.inviteMember({
                    email: inviteEmail.trim().toLowerCase(),
                    role: inviteRole,
                    organizationId,
                    ...(inviteTeamId && inviteTeamId !== NO_TEAM && {teamId: inviteTeamId}),
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to invite");
                    return;
                }
                if (res.data) {
                    setInvitations((prev) => [...prev, res.data as Invitation]);
                    setInviteEmail("");
                    setInviteRole("member");
                    setInviteTeamId(NO_TEAM);
                    setInviteOpen(false);
                    toast.success("Invitation sent");
                }
            } catch (e) {
                toast.error("Failed to send invitation");
                console.error(e);
            }
        });
    }, [inviteEmail, inviteRole, inviteTeamId, organizationId]);

    const removeMember = useCallback((memberIdOrEmail: string) => {
        startTransition(async () => {
            try {
                const res = await authClient.organization.removeMember({
                    memberIdOrEmail: memberIdOrEmail,
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to remove member");
                    return;
                }
                setMembers((prev) =>
                    prev.filter(
                        (m) => m.id !== memberIdOrEmail && m.user?.email !== memberIdOrEmail
                    )
                );
                setRemoveId(null);
                toast.success("Member removed");
            } catch (e) {
                toast.error("Failed to remove member");
                console.error(e);
            }
        });
    }, [setMembers, setRemoveId]);

    const updateRole = useCallback((memberId: string) => {
        if (!roleValue) return;
        startTransition(async () => {
            try {
                const res = await authClient.organization.updateMemberRole({
                    memberId,
                    role: roleValue,
                });
                if (res.error) {
                    toast.error(res.error.message ?? "Failed to update role");
                    return;
                }
                setMembers((prev) =>
                    prev.map((m) =>
                        m.id === memberId ? {...m, role: roleValue} : m
                    )
                );
                setRoleEditId(null);
                setRoleValue("");
                toast.success("Role updated");
            } catch (e) {
                toast.error("Failed to update role");
                console.error(e);
            }
        });
    }, [roleValue, setMembers, setRoleEditId, setRoleValue]);

    const handleSelectInviteRole = useCallback((value: string) => {
        setInviteRole(value as Role);
    }, [setInviteRole]);

    const displayName = (m: Member) =>
        m.user?.name ?? m.user?.email ?? m.userId.slice(0, 8);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Organization members</CardTitle>
                        <CardDescription>
                            View and manage members and their roles.
                        </CardDescription>
                    </div>
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="cursor-pointer">
                                <UserPlus className="size-4 cursor-pointer"/>
                                Invite
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite member</DialogTitle>
                                <DialogDescription>
                                    Send an invitation to join the organization. They must use an
                                    allowed email domain.
                                </DialogDescription>

                            </DialogHeader>
                            <div className="grid gap-2 py-4">
                                <Label htmlFor="invite-email">Email</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@superplay.co"
                                    onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                                />
                                <Label htmlFor="invite-role">Role</Label>
                                <Select
                                    value={inviteRole.toString()}
                                    onValueChange={handleSelectInviteRole}
                                >
                                    <SelectTrigger id="invite-role">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {initialTeams.length > 0 && (
                                    <>
                                        <Label htmlFor="invite-team">Team (optional)</Label>
                                        <Select
                                            value={inviteTeamId}
                                            onValueChange={setInviteTeamId}
                                        >
                                            <SelectTrigger id="invite-team">
                                                <SelectValue placeholder="No specific team"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NO_TEAM}>No specific team</SelectItem>
                                                {initialTeams.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setInviteOpen(false)}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={inviteMember}
                                    disabled={isPending || !inviteEmail.trim()}
                                >
                                    {isPending ? "Sending…" : "Send invite"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-4">
                    {members.length === 0 && invitations.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No members yet. Invite someone above.
                        </p>
                    ) : (
                        <>
                            <ul className="divide-y">
                                {members.map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{displayName(m)}</p>
                                            {m.user?.email && (
                                                <p className="text-muted-foreground text-sm truncate">
                                                    {m.user.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {roleEditId === m.id ? (
                                                <>
                                                    <Select
                                                        value={roleValue}
                                                        onValueChange={setRoleValue}
                                                    >
                                                        <SelectTrigger className="w-28 h-8">
                                                            <SelectValue/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ROLES.map((r) => (
                                                                <SelectItem key={r} value={r}>
                                                                    {r}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        size="xs"
                                                        onClick={() => updateRole(m.id)}
                                                        disabled={isPending || !roleValue}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setRoleEditId(null);
                                                            setRoleValue("");
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                          <span className="text-muted-foreground text-sm capitalize">
                            {m.role}
                          </span>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setRoleEditId(m.id);
                                                            setRoleValue(m.role);
                                                        }}
                                                    >
                                                        Change role
                                                    </Button>
                                                    <Dialog
                                                        open={removeId === m.id}
                                                        onOpenChange={(open) =>
                                                            setRemoveId(open ? m.id : null)
                                                        }
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="icon-xs"
                                                                variant="ghost"
                                                                className="text-destructive hover:text-destructive"
                                                                aria-label="Remove member"
                                                            >
                                                                <Trash2 className="size-3.5"/>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Remove member</DialogTitle>
                                                                <DialogDescription>
                                                                    Remove {displayName(m)} from the organization?
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setRemoveId(null)}
                                                                    disabled={isPending}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={() => removeMember(m.user?.email ?? m.id)}
                                                                    disabled={isPending}
                                                                >
                                                                    {isPending ? "Removing…" : "Remove"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {invitations.length > 0 && (
                                <>
                                    <h4 className="text-muted-foreground text-sm font-medium pt-2">
                                        Pending invitations
                                    </h4>
                                    <ul className="divide-y text-sm">
                                        {invitations
                                            .filter((i) => i.status === "pending")
                                            .map((i) => (
                                                <li
                                                    key={i.id}
                                                    className="flex items-center justify-between py-2"
                                                >
                                                    <span>{i.email}</span>
                                                    <span className="text-muted-foreground capitalize">
                            {i.role ?? "member"}
                          </span>
                                                </li>
                                            ))}
                                    </ul>
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
