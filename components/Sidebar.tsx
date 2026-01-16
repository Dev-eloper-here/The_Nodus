import { Home, BookOpen, BarChart2, ShieldAlert, Settings } from "lucide-react";
import Link from "next/link";

const navItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "My Notes", icon: BookOpen, href: "#" },
    { name: "Progress", icon: BarChart2, href: "#" },
    { name: "Error Vault", icon: ShieldAlert, href: "#" },
];

export default function Sidebar() {
    return (
        <div className="flex flex-col h-full bg-[#18181b] text-zinc-400">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-nodus-green animate-pulse" />
                    Nodus
                </h1>
                <p className="text-xs text-zinc-500 mt-1">AI Coding Tutor</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:text-white transition-colors group"
                    >
                        <item.icon size={20} className="group-hover:text-nodus-green transition-colors" />
                        <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-white/5 hover:text-white transition-colors">
                    <Settings size={20} />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
}
