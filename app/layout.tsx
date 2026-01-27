import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Nodus - Agentic AI Coding Tutor",
    description: "Advanced AI Coding Tutor Dashboard",
};

import { AuthProvider } from "@/lib/auth";

// ... (imports)

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={cn(inter.className, "bg-nodus-dark text-white h-screen overflow-hidden")}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
