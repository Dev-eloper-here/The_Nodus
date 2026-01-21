"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Copy, Plus, MessageSquare, StickyNote, FileText, Send, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";


interface Source {
    id: string; // File name ID
    name: string;
    uri: string;
    mimeType: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function NotebookPage() {
    const [activeTab, setActiveTab] = useState<'sources' | 'chat' | 'notes'>('chat');
    const [sources, setSources] = useState<Source[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // For file input
    const fileInputRef = useRef<HTMLInputElement>(null);
    // For scrolling chat
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                setSources(prev => [...prev, data.file]);
                // Switch to chat after upload
                setActiveTab('chat');
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isGenerating) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsGenerating(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    sources: sources
                })
            });

            if (!response.body) throw new Error("No response body");

            // Add placeholder for model response
            setMessages(prev => [...prev, { role: 'model', text: "" }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                accumulatedText += text;

                // Update last message
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].text = accumulatedText;
                    return newMsgs;
                });
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', text: "Error generating response." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="flex h-screen w-full bg-[#121212] text-white overflow-hidden font-sans">
            {/* Left Pane - Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#18181b]">
                <Sidebar />
            </div>

            {/* Main Notebook Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#18181b]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <StickyNote size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white tracking-wide">Resources</h1>
                            <p className="text-xs text-zinc-500">Untitled • Last edited just now</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                            {sources.length} sources active
                        </span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.txt,.md,.js,.ts,.tsx" // Add specific types as needed
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                            Add Source
                        </button>
                    </div>
                </header>

                {/* 3-Column Layout (Desktop) */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Column 1: Sources */}
                    <div className="w-72 border-r border-white/5 flex flex-col bg-[#18181b]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <h2 className="font-medium text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Sources
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {sources.length === 0 && (
                                <div className="text-center py-10 text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                                    <FileText className="mx-auto mb-2 opacity-20" size={32} />
                                    No sources yet
                                </div>
                            )}
                            {sources.map(source => (
                                <div key={source.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all group relative overflow-hidden">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-zinc-200">{source.name}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{source.mimeType}</p>
                                        </div>
                                    </div>
                                    {/* Hover effect background */}
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Chat (Main) */}
                    <div className="flex-1 flex flex-col bg-[#121212] relative">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 pointer-events-none" />

                        <div className="flex-1 p-6 overflow-y-auto z-10 space-y-6">
                            {messages.length === 0 ? (
                                /* Empty State */
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/5">
                                        <MessageSquare size={32} className="text-zinc-500" />
                                    </div>
                                    <div className="text-center max-w-md">
                                        <h3 className="text-xl font-semibold text-white mb-2">Resources Chat</h3>
                                        <p className="text-sm text-zinc-400">
                                            Upload documents to the left panel (PDF, Text, Code) and I'll answer questions based on their content.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white/5 text-zinc-200 rounded-bl-none border border-white/5"
                                        )}>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-[#18181b] z-20">
                            <div className="max-w-4xl mx-auto relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <div className="relative bg-[#27272a] rounded-2xl border border-white/10 flex items-end p-2 focus-within:border-blue-500/30 transition-colors">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="w-full bg-transparent text-white p-3 min-h-[50px] max-h-[200px] resize-none focus:outline-none text-sm placeholder:text-zinc-600"
                                        placeholder={sources.length > 0 ? "Ask a question about your sources..." : "Upload a source to start chatting..."}
                                        disabled={isGenerating || sources.length === 0}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isGenerating || sources.length === 0}
                                        className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 mb-1 mr-1"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-zinc-600 mt-2">
                                Gemini 1.5 may display inaccurate info, including about people, so double-check its responses.
                            </p>
                        </div>
                    </div>

                    {/* Column 3: Notes (Placeholder for now) */}
                    <div className="w-72 border-l border-white/5 flex flex-col bg-[#18181b]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <h2 className="font-medium text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Notes
                            </h2>
                            <button className="text-zinc-500 hover:text-white transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-center mt-10 text-zinc-600 text-sm">
                                <StickyNote className="mx-auto mb-2 opacity-20" size={32} />
                                Take notes here<br />(Feature coming soon)
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
