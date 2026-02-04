'use server'
import {PropsWithChildren} from "react";
import {redirect} from 'next/navigation'

export async function ProtectedPage({children}: PropsWithChildren) {
    return children;
    // return !!session ? children : redirect('/signin');
}
