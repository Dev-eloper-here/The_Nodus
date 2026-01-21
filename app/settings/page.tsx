"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Settings, Key, Save, CheckCircle, XCircle, Loader2, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");

    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Load current settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.provider) setProvider(data.provider);
                    if (data.geminiKey) setGeminiKey(data.geminiKey);
                    if (data.openaiKey) setOpenaiKey(data.openaiKey);
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
                    openaiKey,
                    provider
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage("Settings saved! Important: Restart your server to apply API changes.");
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
                    <p className="text-zinc-400">Configure your AI providers and application preferences.</p>
                </header>

                <div className="max-w-2xl space-y-8">

                    {/* Provider Selection */}
                    <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Bot size={18} className="text-blue-400" />
                            Active AI Provider
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 hover:bg-white/5",
                                    provider === 'gemini'
                                        ? "border-blue-500 bg-blue-500/10 text-white"
                                        : "border-white/10 text-zinc-500"
                                )}
                            >
                                <Sparkles size={24} className={provider === 'gemini' ? "text-blue-400" : "text-zinc-600"} />
                                <span className="font-semibold">Google Gemini</span>
                                <span className="text-[10px] text-zinc-500">Fast, Long Context, Free Tier</span>
                            </button>

                            <button
                                onClick={() => setProvider('openai')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 hover:bg-white/5",
                                    provider === 'openai'
                                        ? "border-green-500 bg-green-500/10 text-white"
                                        : "border-white/10 text-zinc-500"
                                )}
                            >
                                <Bot size={24} className={provider === 'openai' ? "text-green-400" : "text-zinc-600"} />
                                <span className="font-semibold">OpenAI (ChatGPT)</span>
                                <span className="text-[10px] text-zinc-500">High Quality, Industry Standard</span>
                            </button>
                        </div>
                    </section>

                    {/* API Keys */}
                    <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                <Key size={18} className="text-nodus-green" />
                                API Keys
                            </h2>
                            <p className="text-xs text-zinc-500 mb-6">
                                Enter keys for the services you want to use. Keys are stored locally in .env.local.
                            </p>

                            {/* Gemini Input */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-zinc-400 mb-2">Google Gemini API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        placeholder="AIza..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {provider === 'gemini' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                    </div>
                                </div>
                            </div>

                            {/* OpenAI Input */}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2">OpenAI API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {provider === 'openai' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                                    </div>
                                </div>
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
                                disabled={status === 'testing'}
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
