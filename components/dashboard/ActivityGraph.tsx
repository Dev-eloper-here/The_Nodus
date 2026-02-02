"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityGraphProps {
    activityMap: { [date: string]: number };
}

export default function ActivityGraph({ activityMap }: ActivityGraphProps) {
    // Generate dates for the last 365 days
    const weeks = useMemo(() => {
        const today = new Date();
        const dates: { date: string; count: number; level: number }[] = [];

        // Go back 365 days
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;

            // Level 0-4
            let level = 0;
            if (count > 0) level = 1;
            if (count > 3) level = 2;
            if (count > 6) level = 3;
            if (count > 9) level = 4;

            dates.push({ date: dateStr, count, level });
        }

        // Group by weeks
        const weeksArray: { date: string; count: number; level: number }[][] = [];
        let currentWeek: { date: string; count: number; level: number }[] = [];

        dates.forEach((day) => {
            if (currentWeek.length === 7) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(day);
        });
        if (currentWeek.length > 0) weeksArray.push(currentWeek);

        return weeksArray;
    }, [activityMap]);

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[700px]">
                <div className="flex gap-1">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1">
                            {week.map((day, dIndex) => (
                                <div
                                    key={day.date}
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-[2px] transition-all hover:ring-1 hover:ring-white/50 relative group",
                                        day.level === 0 && "bg-zinc-200 dark:bg-white/5",
                                        day.level === 1 && "bg-green-900/40 border border-green-900",
                                        day.level === 2 && "bg-green-700/60 border border-green-700",
                                        day.level === 3 && "bg-green-500 border border-green-500",
                                        day.level === 4 && "bg-emerald-400 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                    )}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded">
                                        {day.count} contributions on {day.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-500 justify-end">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-200 dark:bg-white/5" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-900/40" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-700/60" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-green-500" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
