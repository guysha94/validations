"use client";


import {memo} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select";


type Props = {
    activeTeam?: {
        id: string;
        name: string;
    };
    teams: {
        id: string;
        name: string;
    }[];
    switchTeam: (teamId: string) => void;
}

export const TeamSelector = memo(function TeamSelector({activeTeam, switchTeam, teams}: Props) {
    return (
        <div
            className="px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            <Select
                value={activeTeam?.id ?? ""}
                onValueChange={switchTeam}
            >
                <SelectTrigger className="h-8 w-full text-left">
                    <SelectValue placeholder="Select team"/>
                </SelectTrigger>
                <SelectContent>
                    {teams?.map((team) => (
                        <SelectItem
                            key={team.id}
                            value={team.id}
                            className="cursor-pointer"
                        >
                            {team.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
});
export default TeamSelector;