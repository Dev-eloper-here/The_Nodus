import { Home, NotebookPen, ShieldAlert, Settings, LogOut, Brain, ChevronRight, ChevronDown, Info, Workflow, Mail, MessageSquare, Plus, Trash2, ChevronUp, Pencil, Check, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import { Loader2, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useChatStore } from "@/lib/store";
import { Thread, getUserThreads, getThreadMessages, deleteThread, updateThreadTitle } from "@/lib/db";

const navItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Resource Chat", icon: NotebookPen, href: "/notebook" },
    { name: "Quiz", icon: Brain, href: "/quiz" },
    { name: "Wallet", icon: ShieldAlert, href: "/wallet" },
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-nodus-green/10 text-nodus-green hover:bg-nodus-green hover:text-white transition-all duration-300 group"
            >
                <UserIcon size={16} />
                <span className="text-xs font-medium">Sign in</span>
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
                    <p className="text-sm font-medium text-zinc-700 dark:text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
            </div>

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // History State
    const { user } = useAuth();
    const { setCurrentThreadId, setMessages, clearMessages, currentThreadId } = useChatStore();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);


    // UI State
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    // AI Toggle State (Persisted in localStorage)
    const [isAIEnabled, setIsAIEnabled] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("enableAI");
        if (stored !== null) {
            setIsAIEnabled(stored === "true");
        }
    }, []);

    const toggleAI = () => {
        const newState = !isAIEnabled;
        setIsAIEnabled(newState);
        localStorage.setItem("enableAI", String(newState));
    };

    // Fetch threads on mount/user change
    useEffect(() => {
        async function loadThreads() {
            if (user) {
                setLoadingThreads(true);
                try {
                    const fetchedThreads = await getUserThreads(user.uid);
                    setThreads(fetchedThreads);
                } catch (error) {
                    console.error("Failed to load threads", error);
                } finally {
                    setLoadingThreads(false);
                }
            } else {
                setThreads([]);
            }
        }
        loadThreads();
    }, [user, currentThreadId]); // Reload when currentThreadId changes (e.g. new chat created)

    // Auto-focus input when editing starts
    useEffect(() => {
        if (editingThreadId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingThreadId]);

    const handleNewChat = () => {
        clearMessages();
        // currentThreadId automatically cleared by clearMessages store action
    };

    const handleSelectThread = async (threadId: string) => {
        if (editingThreadId) return; // Prevent selection if editing
        if (threadId === currentThreadId) return;

        setLoadingThreads(true); // Re-use loading state or add specific one
        try {
            const msgs = await getThreadMessages(threadId);
            // Transform dbMessage to Message
            const storeMsgs = msgs.map(m => ({
                role: m.role,
                content: m.content
            }));

            setMessages(storeMsgs);
            setCurrentThreadId(threadId);
        } catch (error) {
            console.error("Failed to load thread messages", error);
        } finally {
            setLoadingThreads(false);
        }
    };

    const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation(); // Prevent selecting the thread
        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
            await deleteThread(threadId);
            // Remove from local state
            setThreads(prev => prev.filter(t => t.id !== threadId));

            // If deleting active thread, clear screen
            if (currentThreadId === threadId) {
                clearMessages();
            }
        } catch (error) {
            console.error("Failed to delete thread", error);
        }
    };

    const startEditing = (e: React.MouseEvent, thread: Thread) => {
        e.stopPropagation();
        setEditingThreadId(thread.id);
        setEditTitle(thread.title);
    };

    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingThreadId(null);
        setEditTitle("");
    };

    const saveTitle = async (e: React.MouseEvent | React.FormEvent, threadId: string) => {
        e.stopPropagation();
        e.preventDefault(); // In case called from form

        if (!editTitle.trim()) {
            cancelEditing();
            return;
        }

        // Optimistic update
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: editTitle.trim() } : t));
        setEditingThreadId(null);

        try {
            await updateThreadTitle(threadId, editTitle.trim());
        } catch (error) {
            console.error("Failed to update title", error);
            // Revert on failure (optional)
        }
    };

    const displayedThreads = isHistoryExpanded ? threads : threads.slice(0, 3);

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-white/5 transition-colors duration-300">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-nodus-green animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Nodus <span className="text-[10px] font-mono bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">v1.1</span>
                </h1>
                <p className="text-xs text-zinc-500 mt-1 font-medium pl-5">AI Coding Tutor</p>

                {/* Removed Global New Chat Button from here */}
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-6">
                {/* Navigation */}
                <nav className="space-y-1">
                    <div className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Menu</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-nodus-green/10 text-nodus-green dark:text-white shadow-sm ring-1 ring-nodus-green/20"
                                        : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                )}
                            >
                                <item.icon
                                    size={18}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-nodus-green" : "group-hover:text-nodus-green text-zinc-400 dark:text-zinc-500"
                                    )}
                                />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* History Section */}
                {user && (
                    <div className="space-y-1">
                        <div className="px-2 flex items-center justify-between mb-2">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Chats</div>
                            {/* New Chat Button in Header */}
                            <button
                                onClick={handleNewChat}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                title="New Chat"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {loadingThreads && threads.length === 0 ? (
                            <div className="flex flex-col gap-2 px-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {threads.length === 0 ? (
                                    <div className="px-4 py-3 text-xs text-zinc-500 italic text-center border border-dashed border-zinc-200 dark:border-white/10 rounded-lg">
                                        No history yet
                                    </div>
                                ) : (
                                    <>
                                        {displayedThreads.map(thread => (
                                            <div
                                                key={thread.id}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer",
                                                    currentThreadId === thread.id && editingThreadId !== thread.id
                                                        ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium"
                                                        : "hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                )}
                                                onClick={() => handleSelectThread(thread.id)}
                                            >
                                                {editingThreadId === thread.id ? (
                                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            ref={editInputRef}
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveTitle(e, thread.id);
                                                                if (e.key === 'Escape') cancelEditing();
                                                            }}
                                                            className="flex-1 bg-transparent border-b border-nodus-green text-xs focus:outline-none min-w-0"
                                                        />
                                                        <button onClick={(e) => saveTitle(e, thread.id)} className="text-green-500 hover:bg-green-500/10 p-1 rounded"><Check size={12} /></button>
                                                        <button onClick={cancelEditing} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><X size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-3 truncate flex-1">
                                                            <MessageSquare size={16} className={cn("flex-shrink-0", currentThreadId === thread.id ? "text-nodus-green" : "text-zinc-400")} />
                                                            <span className="text-xs truncate">{thread.title}</span>
                                                        </div>
                                                        <div className="flex items-center opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => startEditing(e, thread)}
                                                                className="text-zinc-400 hover:text-blue-500 transition-all p-1 rounded hover:bg-white/10"
                                                                title="Rename"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteThread(e, thread.id)}
                                                                className="text-zinc-400 hover:text-red-500 transition-all p-1 rounded hover:bg-white/10"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {/* Show More / Show Less Toggle */}
                                        {threads.length > 3 && (
                                            <button
                                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                                className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase font-bold tracking-wider"
                                            >
                                                {isHistoryExpanded ? (
                                                    <>Show Less <ChevronUp size={12} /></>
                                                ) : (
                                                    <>Show More <ChevronDown size={12} /></>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-white/5 space-y-2 bg-zinc-50/50 dark:bg-transparent">
                {/* Settings Popover Trigger - Now Global */}
                <div className="relative">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 group"
                    >
                        <Settings
                            size={16}
                            className={cn("transition-transform duration-500", isSettingsOpen ? "rotate-90 text-nodus-green" : "group-hover:text-nodus-green")}
                        />
                        <span className="text-xs font-medium">Settings & Info</span>
                        {isSettingsOpen ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
                    </button>

                    {/* Settings Menu */}
                    {isSettingsOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                            <Link
                                href="/about"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border-b border-zinc-200 dark:border-white/5"
                            >
                                <Info size={16} className="text-blue-400" />
                                <span className="text-xs font-medium">About Nodus</span>
                            </Link>
                            <Link
                                href="/userflow"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border-b border-zinc-200 dark:border-white/5"
                            >
                                <Workflow size={16} className="text-purple-400" />
                                <span className="text-xs font-medium">User Flow</span>
                            </Link>
                            <a
                                href="mailto:devchaudhary.tech@gmail.com"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors border-b border-white/5"
                            >
                                <Mail size={16} className="text-nodus-green" />
                                <span className="text-xs font-medium">Contact Developer</span>
                            </a>

                            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-zinc-200 dark:border-white/5">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Enable AI Tutor</span>
                                <button
                                    onClick={toggleAI}
                                    className={cn(
                                        "w-8 h-4 rounded-full transition-colors relative",
                                        isAIEnabled ? "bg-nodus-green" : "bg-zinc-300 dark:bg-zinc-600"
                                    )}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                        isAIEnabled ? "left-4.5" : "left-0.5"
                                    )} style={{ left: isAIEnabled ? "18px" : "2px" }} />
                                </button>
                            </div>

                            <div className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <span className="text-xs font-medium text-zinc-400">Appearance</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    )}
                </div>

                <UserProfile />
            </div>
        </div>
    );
}
