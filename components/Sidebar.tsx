"use client";

import { Home, NotebookPen, ShieldAlert, Settings, LogOut, Brain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Quiz", icon: Brain, href: "/quiz" },
    { name: "My Notes", icon: NotebookPen, href: "/notebook" },
    { name: "Wallet", icon: ShieldAlert, href: "/wallet" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-[#18181b] text-zinc-400 border-r border-white/5">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-nodus-green animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Nodus
                </h1>
                <p className="text-xs text-zinc-500 mt-1 font-medium pl-5">AI Coding Tutor</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-nodus-green/10 text-white shadow-sm ring-1 ring-nodus-green/20"
                                    : "hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-nodus-green rounded-r-full" />
                            )}
                            <item.icon
                                size={20}
                                className={cn(
                                    "transition-colors",
                                    isActive ? "text-nodus-green" : "group-hover:text-nodus-green text-zinc-500"
                                )}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-2">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-white/5 hover:text-white transition-colors group">
                    <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                    <span className="text-sm font-medium">Settings</span>
                </Link>
            </div>
        </div>
    );
}
