import {AuthView} from "@daveyplate/better-auth-ui"
import {authViewPaths} from "@daveyplate/better-auth-ui/server"

export const dynamicParams = false

export function generateStaticParams() {
    const paths = Object.values(authViewPaths).filter((p) => p !== "accept-invitation");
    return paths.map((path) => ({path}));
}

type Props = { params: Promise<{ path: string }> };

export default async function AuthPage({params}: Props) {
    const {path} = await params

    return (
        <main className="flex min-h-svh w-full items-center justify-center">
            <div className="w-full max-w-sm px-4">
                <AuthView path={path}/>
            </div>
        </main>
    )
}