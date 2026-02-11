'use server'
import {PropsWithChildren} from "react";
import {redirect} from 'next/navigation'
import {auth} from "@/lib/auth/server"
import {headers} from "next/headers"

export async function ProtectedPage({children}: PropsWithChildren) {

    const session = await auth.api.getSession({
        headers: await headers()
    });

    return !!session ? children : redirect('/sign-in');
}
