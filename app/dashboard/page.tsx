"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import { useAuth } from "@/lib/auth";
import { getUserStats } from "@/lib/gamification";
import { Flame, Trophy, Target, CalendarDays, Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user) {
                const data = await getUserStats(user.uid);
                setStats(data);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    if (!user) {
        return (
            <div className="h-screen w-full flex bg-zinc-50 dark:bg-[#121212] text-white">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-500">Please sign in to view your dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex h-screen w-full bg-zinc-50 dark:bg-[#121212] text-zinc-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
            {/* Left Pane - Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-[#18181b] transition-colors duration-300">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto transition-colors duration-300">
                {/* Header */}
                <header className="h-20 border-b border-zinc-200 dark:border-white/5 flex items-center px-8 bg-white dark:bg-[#18181b] flex-shrink-0 transition-colors duration-300">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Your Progress</h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Track your learning journey</p>
                    </div>
                </header>

                <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Streak Card */}
                                <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Flame size={80} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                            <Flame size={20} />
                                        </div>
                                        <h3 className="font-semibold text-zinc-500 text-sm">Current Streak</h3>
                                    </div>
                                    <div className="text-4xl font-bold mb-1">{stats?.currentStreak || 0} <span className="text-lg text-zinc-500 font-normal">days</span></div>
                                    <p className="text-xs text-zinc-400">Keep it up! Consistency is key.</p>
                                </div>

                                {/* Total Contributions */}
                                <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Target size={80} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                            <Target size={20} />
                                        </div>
                                        <h3 className="font-semibold text-zinc-500 text-sm">Total Activities</h3>
                                    </div>
                                    <div className="text-4xl font-bold mb-1">{stats?.totalActivities || 0}</div>
                                    <p className="text-xs text-zinc-400">Chats, Saves, and Uploads combined.</p>
                                </div>

                                {/* Active Days */}
                                <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <CalendarDays size={80} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                            <CalendarDays size={20} />
                                        </div>
                                        <h3 className="font-semibold text-zinc-500 text-sm">Active Days</h3>
                                    </div>
                                    <div className="text-4xl font-bold mb-1">{Object.keys(stats?.activityMap || {}).length}</div>
                                    <p className="text-xs text-zinc-400">Total days you've been active.</p>
                                </div>
                            </div>

                            {/* Activity Graph */}
                            <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-white/5 rounded-2xl p-6">
                                <h3 className="font-semibold mb-6 flex items-center gap-2">
                                    <Trophy size={18} className="text-yellow-500" />
                                    Contribution Activity
                                </h3>
                                <ActivityGraph activityMap={stats?.activityMap || {}} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
