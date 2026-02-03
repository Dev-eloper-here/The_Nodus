import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Nodus - Agentic AI Coding Tutor",
    description: "Advanced AI Coding Tutor Dashboard",
};

import { AuthProvider } from "@/lib/auth";
import AgentMonitor from "@/components/AgentMonitor";

// ... (imports)

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(inter.className, "bg-white dark:bg-nodus-dark text-zinc-950 dark:text-white h-screen overflow-hidden transition-colors duration-300")}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <AgentMonitor />
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
