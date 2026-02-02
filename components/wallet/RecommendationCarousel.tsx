"use client";

import { useEffect, useState } from "react";
import { Play, FileText, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface RecItem {
    id: string;
    title: string;
    type: 'video' | 'article';
    thumbnail: string;
    reason: string;
    url?: string; // Optional external link
}

export default function RecommendationCarousel() {
    const { user } = useAuth();
    const [items, setItems] = useState<RecItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        fetch(`/api/recommendations?userId=${user.uid}`)
            .then(res => res.json())
            .then(data => {
                if (data.items) setItems(data.items);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user || loading) return (
        <div className="h-48 flex items-center justify-center border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#18181b]/50">
            <div className="animate-pulse flex space-x-4">
                <div className="w-64 h-32 bg-zinc-200 dark:bg-white/5 rounded-xl"></div>
                <div className="w-64 h-32 bg-zinc-200 dark:bg-white/5 rounded-xl hidden md:block"></div>
                <div className="w-64 h-32 bg-zinc-200 dark:bg-white/5 rounded-xl hidden lg:block"></div>
            </div>
        </div>
    );

    if (items.length === 0) return null;

    return (
        <div className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/30 dark:bg-[#18181b]/30 py-6">
            <div className="px-8 mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap size={16} className="text-amber-500 fill-amber-500" />
                    Recommended For You
                </h2>
                <button className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center transition-colors">
                    View All <ChevronRight size={14} />
                </button>
            </div>

            {/* Scroll Container */}
            <div className="flex overflow-x-auto px-8 gap-4 pb-4 scrollbar-hide snap-x">
                {items.map(item => (
                    <div
                        key={item.id}
                        className="flex-shrink-0 w-72 group relative snap-start cursor-pointer transition-transform active:scale-95"
                        onClick={() => item.url && window.open(item.url, '_blank')}
                    >
                        {/* Thumbnail */}
                        <div className="aspect-video rounded-xl bg-zinc-200 dark:bg-white/10 relative overflow-hidden mb-3 shadow-sm border border-zinc-200 dark:border-white/5 group-hover:shadow-md transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                                    {item.type === 'video' ? <Play size={18} fill="currentColor" /> : <FileText size={18} />}
                                </div>
                            </div>

                            {/* Type Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10">
                                {item.type}
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug mb-1 group-hover:text-blue-500 transition-colors line-clamp-2">
                                {item.title}
                            </h3>
                            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                {item.reason}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
