"use client";

import {type ComponentProps} from "react";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card";
import {GoogleIcon} from "~/components/icons";
import {useAuth} from "~/hooks/useAuth";

export function LoginForm({
                              className,
                              errorMessage,
                              ...props
                          }: ComponentProps<"div"> & { errorMessage?: string | null }) {
    const {isPending, signin} = useAuth();

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            {errorMessage && (
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                >
                    {errorMessage}
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Sign in to your account</CardTitle>
                    <CardDescription>
                        Use your Google account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer gap-2"
                        onClick={signin}
                        disabled={isPending}
                    >
                        <GoogleIcon/>
                        {isPending ? "Redirecting…" : "Continue with Google"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
