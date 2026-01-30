"use client";

import { useState } from "react";
import { Lightbulb, ShieldAlert, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface WalletSuggestionProps {
    type: 'concept' | 'error';
    title: string;
    summary: string;
    tags?: string[];
    severity?: 'low' | 'medium' | 'high';
    onSave?: () => void;
}

export default function WalletSuggestion({ type, title, summary, tags = [], severity, onSave }: WalletSuggestionProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    type,
                    title,
                    summary,
                    tags,
                    severity: type === 'error' ? (severity || 'medium') : undefined,
                    status: type === 'error' ? 'unresolved' : undefined
                })
            });

            if (!response.ok) throw new Error("Failed to save");

            setIsSaved(true);
            if (onSave) onSave();
        } catch (err) {
            console.error("Failed to save suggestion", err);
            setError("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    if (isSaved) {
        return (
            <div className="my-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-in fade-in zoom-in-95">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <Check size={16} />
                </div>
                <div>
                    <p className="text-sm font-medium text-green-400">Saved to {type === 'concept' ? 'Concept' : 'Error'} Wallet</p>
                    <p className="text-xs text-green-500/70">You can view it in the Wallet tab.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-4 border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {type === 'concept' ? (
                        <Lightbulb size={16} className="text-yellow-500" />
                    ) : (
                        <ShieldAlert size={16} className="text-red-500" />
                    )}
                    <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                        Suggested {type === 'concept' ? 'Concept' : 'Error Log'}
                    </span>
                </div>
                {tags.length > 0 && (
                    <div className="flex gap-1">
                        {tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h4 className="font-semibold text-white mb-2">{title}</h4>
                <p className="text-sm text-zinc-400 mb-4 line-clamp-3">{summary}</p>

                {/* Actions */}
                <div className="flex items-center justify-between mt-2">
                    {error ? (
                        <span className="text-xs text-red-400">{error}</span>
                    ) : (
                        <span className="text-xs text-zinc-600">
                            {type === 'error' && severity ? `${severity} severity` : 'Auto-generated'}
                        </span>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !user}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            type === 'concept'
                                ? "bg-yellow-500 text-black hover:bg-yellow-400"
                                : "bg-red-500 text-white hover:bg-red-600",
                            (isSaving || !user) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Plus size={14} />
                        )}
                        {isSaving ? "Saving..." : "Add to Wallet"}
                    </button>
                </div>
            </div>
        </div>
    );
}
