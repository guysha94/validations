"use client"

import {ComponentProps, memo} from "react"
import {ThemeProvider as NextThemesProvider} from "next-themes"

type Props = ComponentProps<typeof NextThemesProvider>


export const ThemeProvider = memo(function ThemeProvider({children, ...props}: Props) {
    return (
        <NextThemesProvider
            {...props}>
            {children}
        </NextThemesProvider>)
});

export default ThemeProvider;