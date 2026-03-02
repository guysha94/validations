"use client"

import * as React from "react"
import {memo, useMemo} from "react"
import {MonitorCog, Moon, Sun} from "lucide-react"
import {useTheme} from "next-themes"
import {DARK_MODES} from "~/lib/constants";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select";


const modes = {
    light: {
        name: "Light",
        icon: <Sun size={16}/>,
    },
    dark: {
        name: "Dark",
        icon: <Moon size={16}/>,
    },
    system: {
        name: "System",
        icon: <MonitorCog size={16}/>,
    },
};


export const DarkModeToggler = memo(function DarkModeToggler() {
    const {setTheme, theme, systemTheme} = useTheme();

    const activeTheme = useMemo(() => (theme === "system" ? systemTheme : theme) || "system", [theme, systemTheme]);

    return (
        <div
            className="px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            <Select
                value={activeTheme}
                onValueChange={setTheme}
            >
                <SelectTrigger className="h-8 w-full text-left">
                    <SelectValue placeholder="Select team"/>
                </SelectTrigger>
                <SelectContent>
                    {DARK_MODES?.map((mode, idx) => (
                        <SelectItem
                            key={idx}
                            value={mode}
                            className="cursor-pointer"
                        >
                            {modes[mode as keyof typeof modes].icon}
                            {modes[mode as keyof typeof modes].name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )

});

export default DarkModeToggler;
