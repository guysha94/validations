import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import AppProviders from "~/components/providers";
import {ReactNode, Suspense} from "react";
import ScrollToTop from "~/components/ScrollToTop";
import Loader from "~/components/Loader";
import {NuqsAdapter} from 'nuqs/adapters/next/app'

const fontSans = Geist({
    subsets: ["latin"],
    variable: "--font-sans",
})

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export const metadata: Metadata = {
    title: "Validations App",
    description: "An app to manage and run validations.",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
        >
        <NuqsAdapter>
            <Suspense fallback={<Loader fullscreen/>}>
                <AppProviders>
                    {children}
                    <ScrollToTop/>
                </AppProviders>
            </Suspense>
        </NuqsAdapter>
        </body>
        </html>
    );
}
