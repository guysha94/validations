import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import AppProviders from "~/components/providers";


import {ReactNode} from "react";
import ScrollToTop from "~/components/ScrollToTop";
import NewEventDialog from "~/components/NewEventDialog";


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
        <AppProviders>
            {children}
            <ScrollToTop/>
            <NewEventDialog/>
        </AppProviders>
        </body>
        </html>
    );
}
