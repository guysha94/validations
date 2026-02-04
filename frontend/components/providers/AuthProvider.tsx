"use client"
import {PropsWithChildren} from "react";


type AuthProviderProps = {
    session?: any | null | undefined
}

export default function AuthProvider({session, children}: PropsWithChildren<AuthProviderProps>) {
    
    return children;
    // return (
    //     <SessionProvider
    //         session={session}
    //         refetchInterval={3 * 60}
    //         refetchOnWindowFocus
    //     >
    //         {children}
    //     </SessionProvider>
    // )
}
