"use client";

import { Home, NotebookPen, ShieldAlert, Settings, LogOut, Brain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import { Loader2, User as UserIcon } from "lucide-react";

const navItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Quiz", icon: Brain, href: "/quiz" },
    { name: "Resource Chat", icon: NotebookPen, href: "/notebook" },
    { name: "Wallet", icon: ShieldAlert, href: "/wallet" },
];

function UserProfile() {
    const { user, signInWithGoogle, logout, loading } = useAuth();

    if (loading) {
        return (
            <div className="px-4 py-3 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-nodus-green/10 text-nodus-green hover:bg-nodus-green hover:text-white transition-all duration-300 group"
            >
                <UserIcon size={20} />
                <span className="text-sm font-medium">Sign in</span>
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-2">
                {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-white/10" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        {user.displayName?.[0] || "U"}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
            </div>

            <Link href="/settings" className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                <Settings size={16} />
                <span className="text-xs font-medium">Settings</span>
            </Link>

            <button
                onClick={() => logout()}
                className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
            >
                <LogOut size={16} />
                <span className="text-xs font-medium">Log out</span>
            </button>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full w-full bg-[#18181b] text-zinc-400 border-r border-white/5">
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
                <UserProfile />
            </div>
        </div>
    );
}
