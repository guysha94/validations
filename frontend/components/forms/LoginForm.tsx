"use client"
import {ComponentProps, MouseEvent} from "react"
import {signIn} from "next-auth/react"
import {cn} from "~/lib/utils"
import {Button} from "~/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card"
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel,} from "~/components/ui/field"
import {Input} from "~/components/ui/input"
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Controller, useForm} from "react-hook-form";

const formSchema = z.object({
    email: z.string().min(2, {message: "Email is required"}).email({message: "Invalid email address"}),
    password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
})

export function LoginForm({
                              className,
                              ...props
                          }: ComponentProps<"div">) {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })
    const onGoogleClicked = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Google sign-in clicked");
        await signIn('google');
    };

    const onSubmit = async (data: z.infer<typeof formSchema>) => {

        await signIn('credentials', {
            email: data.email,
            password: data.password,
            redirect: true,
            callbackUrl: '/',
        });
    };


    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <Controller
                                name="email"
                                control={form.control}
                                render={({field, fieldState}) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-rhf-demo-title">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Login button not working on mobile"
                                            autoComplete="email"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]}/>
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="password"
                                control={form.control}
                                render={({field, fieldState}) => (
                                    <Field>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Forgot your password?
                                            </a>
                                        </div>
                                        <Input {...field} type="password" placeholder="********" autoComplete="off"/>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]}/>
                                        )}
                                    </Field>
                                )}
                            />

                            <Field>
                                <Button type="submit" className="cursor-pointer">Login</Button>
                                <Button variant="outline" type="button" onClick={onGoogleClicked}
                                        className="cursor-pointer">
                                    Login with Google
                                </Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <a href="#">Sign up</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
