
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Settings, Key, Save, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    // Hardcoded to Gemini
    const provider = 'gemini';
    const [geminiKey, setGeminiKey] = useState("");

    // Status
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Load current settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.geminiKey) setGeminiKey(data.geminiKey);
                }
            })
            .catch(err => console.error("Failed to load settings", err));
    }, []);

    const handleSave = async () => {
        setStatus('testing');
        setMessage("Saving configuration...");

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    geminiKey,
                    provider: 'gemini'
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage("Settings saved! Please restart the server to apply changes.");
            } else {
                throw new Error(data.error);
            }

        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || "Failed to save.");
        }
    };

    return (
        <main className="flex h-screen w-full bg-[#121212] text-white overflow-hidden font-sans">
            <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#18181b]">
                <Sidebar />
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-800 rounded-lg">
                            <Settings size={24} className="text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                    </div>
                    <p className="text-zinc-400">Configure your application preferences.</p>
                </header>

                <div className="max-w-2xl space-y-8">

                    {/* Active Provider Info */}
                    <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Sparkles size={18} className="text-blue-400" />
                            AI Provider
                        </h2>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Google Gemini (Vertex AI)</h3>
                                <p className="text-xs text-blue-200">Active & Configured</p>
                            </div>
                        </div>
                    </section>

                    {/* API Keys */}
                    <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                <Key size={18} className="text-nodus-green" />
                                API Configuration
                            </h2>
                            <p className="text-xs text-zinc-500 mb-6">
                                Update your Google Gemini API Key here.
                            </p>

                            {/* Gemini Input */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Google Gemini API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => {
                                            setGeminiKey(e.target.value);
                                            setStatus('idle');
                                        }}
                                        placeholder={geminiKey ? "••••••••••••••••" : "AIza..."}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                                    />
                                    {geminiKey && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                            Configured
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-[10px] text-zinc-600 flex flex-col gap-1">
                                    <span>To hide/secure this key in production, set <code>GEMINI_API_KEY</code> in your environment variables.</span>
                                </p>
                            </div>
                        </div>

                        {status === 'success' && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-sm text-green-400 animate-in fade-in">
                                <CheckCircle size={16} />
                                {message}
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400 animate-in fade-in">
                                <XCircle size={16} />
                                {message}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button
                                onClick={handleSave}
                                disabled={status === 'testing' || !geminiKey.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {status === 'testing' ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Configuration
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
