"use client"

import {AuthUIProvider} from "@daveyplate/better-auth-ui"
import Link from "next/link"
import {useRouter} from "next/navigation"
import type {ReactNode} from "react"
import {authClient} from "~/lib/auth/client";
import {ROOT_ROUTE} from "~/lib/constants";

const customRoles = [
    {role: "owner", label: "Owner"},
    {role: "admin", label: "Admin"},
    {role: "member", label: "Member"},
    {role: "viewer", label: "Viewer"},
]

export default function AuthProviders({children}: { children: ReactNode }) {
    const router = useRouter();


    return (
        <AuthUIProvider
            authClient={authClient}
            credentials={false}
            navigate={router.push}
            replace={router.replace}
            social={{providers: ["google"]}}
            onSessionChange={() => {
                router.refresh()
            }}
            organization={{
                basePath: "/organization",
                pathMode: "default",
                customRoles,
            }}

            redirectTo={ROOT_ROUTE}
            signUp={false}
            teams={{
                enabled: true,
                customRoles,


            }}
            Link={Link}
        >
            {children}
        </AuthUIProvider>
    )
}