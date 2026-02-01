"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Copy, Plus, MessageSquare, StickyNote, FileText, Send, Trash2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from "@/lib/auth";
import { useChatStore, Message } from "@/lib/store";

import NotebookUploader from "@/components/notebook/NotebookUploader";
import { NoteSource } from "@/lib/types";
import WalletSuggestion from "@/components/wallet/WalletSuggestion";
import { parseWalletSuggestion } from "@/lib/messageParser";

export default function NotebookPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'sources' | 'chat' | 'notes'>('chat');
    const [sources, setSources] = useState<NoteSource[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("nodus_notebook_sources");
        if (saved) {
            try {
                setSources(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse sources", e);
            }
        }
    }, []);

    // Global Chat Store
    const { messages, addMessage, setMessages, currentThreadId, setCurrentThreadId } = useChatStore();

    // Local state for notebook specific UI (sources, notes, etc)
    const [isLoadingSources, setIsLoadingSources] = useState(true);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        if (user) {
            console.log("NotebookPage: Fetching sources for user", user.uid);
            fetch(`/api/notebook?userId=${user.uid}`)
                .then(res => res.json())
                .then(data => {
                    console.log("NotebookPage: Fetched sources", data);
                    if (data.items) {
                        setSources(data.items);
                        localStorage.setItem("nodus_notebook_sources", JSON.stringify(data.items));
                    }
                })
                .catch(err => console.error("Failed to load sources", err))
                .finally(() => setIsLoadingSources(false));
        } else {
            console.log("NotebookPage: No user found after auth load");
            setIsLoadingSources(false);
        }
    }, [user, authLoading]);

    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [enableWebSearch, setEnableWebSearch] = useState(false);

    // For scrolling chat
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUploadSuccess = (newSource: NoteSource) => {
        setSources(prev => {
            const updated = [...prev, newSource];
            localStorage.setItem("nodus_notebook_sources", JSON.stringify(updated));
            return updated;
        });
        setActiveTab('chat');
    };

    const handleDeleteSource = async (sourceId: string) => {
        if (!confirm("Are you sure you want to remove this source?")) return;

        // Optimistic update
        setSources(prev => {
            const updated = prev.filter(s => s.id !== sourceId);
            localStorage.setItem("nodus_notebook_sources", JSON.stringify(updated));
            return updated;
        });

        try {
            await fetch("/api/notebook", {
                method: "DELETE",
                body: JSON.stringify({ sourceId })
            });
        } catch (err) {
            console.error("Failed to delete source", err);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isGenerating) return;

        const userMsgContent = input.trim();
        setInput("");

        // Add User Message to Store
        const userMsg: Message = { role: 'user', content: userMsgContent };
        addMessage(userMsg); // Using store action

        setIsGenerating(true);
        let activeThreadId = currentThreadId;

        try {
            // 1. Create Thread if not exists (and user is logged in)
            if (!activeThreadId && user) {
                const title = userMsgContent.split(' ').slice(0, 5).join(' ') + "...";
                try {
                    const { createThread } = await import("@/lib/db");
                    activeThreadId = await createThread(user.uid, title);
                    setCurrentThreadId(activeThreadId);
                } catch (err) {
                    console.error("Failed to create thread", err);
                }
            }

            // 2. Save User Message to Firestore
            if (activeThreadId && user) {
                const { addMessageToThread } = await import("@/lib/db");
                await addMessageToThread(activeThreadId, 'user', userMsgContent);
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsgContent,
                    sources: sources, // Pass sources for RAG (Notebook specific feature)
                    history: messages.concat(userMsg), // Pass full history from store
                    enableWebSearch // Pass the flag
                })
            });

            if (!response.body) throw new Error("No response body");

            // Add placeholder for model response
            addMessage({ role: 'ai', content: "" });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                accumulatedText += text;

                // Update last message
                setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = accumulatedText;
                    return newMsgs;
                });
            }

            // 3. Save AI Message to Firestore
            if (activeThreadId && user) {
                const { addMessageToThread } = await import("@/lib/db");
                await addMessageToThread(activeThreadId, 'ai', accumulatedText);
            }

        } catch (err: any) {
            console.error(err);
            // Update error message
            setMessages((prev) => {
                const newMsgs = [...prev];
                if (newMsgs[newMsgs.length - 1].role === 'ai') {
                    newMsgs[newMsgs.length - 1].content = "Error generating response.";
                } else {
                    newMsgs.push({ role: 'ai', content: "Error generating response." });
                }
                return newMsgs;
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Notes Persistence
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("nodus_notebook_notes");
        if (saved) setNotes(saved);
    }, []);

    // Save notes on change
    useEffect(() => {
        localStorage.setItem("nodus_notebook_notes", notes);
    }, [notes]);

    return (
        <main className="flex h-screen w-full bg-zinc-50 dark:bg-[#121212] text-zinc-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
            {/* Left Pane - Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-[#18181b] transition-colors duration-300">
                <Sidebar />
            </div>

            {/* Main Notebook Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-6 bg-white dark:bg-[#18181b] transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <StickyNote size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Resources</h1>
                            <p className="text-xs text-zinc-500">Untitled • Last edited just now</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                            {sources.length} sources active
                        </span>
                    </div>
                </header>

                {/* 3-Column Layout (Desktop) */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Column 1: Sources */}
                    <div className="w-72 border-r border-zinc-200 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-[#18181b]/50 transition-colors duration-300">
                        <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#18181b]">
                            <h2 className="font-medium text-xs text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                Sources
                            </h2>
                            {/* Web Search Checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={enableWebSearch}
                                        onChange={(e) => setEnableWebSearch(e.target.checked)}
                                        className="peer w-4 h-4 rounded border border-zinc-600 bg-zinc-800/50 checked:bg-green-500 checked:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all cursor-pointer appearance-none"
                                    />
                                    <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className={cn("text-xs font-medium transition-colors", enableWebSearch ? "text-green-400" : "text-zinc-500 group-hover:text-zinc-400")}>
                                    Include Web Search
                                </span>
                            </label>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div className="mb-4">
                                <NotebookUploader onUploadSuccess={handleUploadSuccess} />
                            </div>

                            {isLoadingSources && (
                                <div className="flex flex-col gap-2 animate-pulse">
                                    <div className="h-12 bg-white/5 rounded-xl border border-white/5" />
                                    <div className="h-12 bg-white/5 rounded-xl border border-white/5" />
                                </div>
                            )}

                            {!isLoadingSources && sources.length === 0 && (
                                <div className="text-center py-4 text-zinc-600 text-sm">
                                    <FileText className="mx-auto mb-2 opacity-20" size={32} />
                                    No sources yet
                                </div>
                            )}
                            {sources.map(source => (
                                <div key={source.id} className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-blue-500/30 group relative overflow-hidden flex items-center gap-3 transition-colors duration-200">
                                    <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-zinc-700 dark:text-zinc-200">{source.title}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{source.type}</p>
                                    </div>

                                    {/* Delete Button (Always Visible) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSource(source.id);
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded transition-all"
                                        title="Remove Source"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    {/* Hover effect background */}
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Chat (Main) */}
                    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#121212] relative transition-colors duration-300">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 pointer-events-none" />

                        <div className="flex-1 p-6 overflow-y-auto z-10 space-y-6">
                            {messages.length === 0 ? (
                                /* Empty State */
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-zinc-200 dark:border-white/5">
                                        <MessageSquare size={32} className="text-zinc-400 dark:text-zinc-500" />
                                    </div>
                                    <div className="text-center max-w-md">
                                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Resources Chat</h3>
                                        <p className="text-sm text-zinc-400">
                                            Upload documents or enable Web Search to start chatting. I can utilize both your files and Google Search.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={cn(
                                            "flex w-full",
                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                        )}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm",
                                                msg.role === 'user'
                                                    ? "bg-blue-600 text-white rounded-br-none"
                                                    : "bg-white dark:bg-white/5 text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-200 dark:border-white/5"
                                            )}>
                                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code: CodeBlock,
                                                        }}
                                                    >
                                                        {parseWalletSuggestion(msg.content).text}
                                                    </ReactMarkdown>
                                                </div>
                                                {msg.role === 'ai' && parseWalletSuggestion(msg.content).suggestion && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <WalletSuggestion {...parseWalletSuggestion(msg.content).suggestion!} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#18181b] z-20 transition-colors duration-300">
                            <div className="max-w-4xl mx-auto relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <div className="relative bg-zinc-50 dark:bg-[#27272a] rounded-2xl border border-zinc-200 dark:border-white/10 flex items-end p-2 focus-within:border-blue-500/30 transition-colors">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="w-full bg-transparent text-zinc-900 dark:text-white p-3 min-h-[50px] max-h-[200px] resize-none focus:outline-none text-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-600"
                                        placeholder="Ask a question..."
                                        disabled={isGenerating}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isGenerating}
                                        className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 mb-1 mr-1"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-zinc-600">
                                        Gemini 1.5 may display inaccurate info.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Notes (Active) */}
                    <div className="w-72 border-l border-zinc-200 dark:border-white/5 flex flex-col bg-amber-50/30 dark:bg-[#18181b]/50 transition-colors duration-300">
                        <div className="p-4 border-b border-amber-100/50 dark:border-white/5 flex items-center justify-between bg-amber-50/50 dark:bg-[#18181b]">
                            <h2 className="font-medium text-xs text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                Notes
                            </h2>
                            <button className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex-1 p-0 bg-amber-50/30 dark:bg-transparent">
                            <textarea
                                className="w-full h-full bg-transparent text-zinc-800 dark:text-zinc-200 text-sm p-4 resize-none focus:outline-none font-mono leading-relaxed placeholder:text-amber-700/30 dark:placeholder:text-zinc-700 selection:bg-amber-200 dark:selection:bg-amber-900/30"
                                placeholder="Start typing your notes here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

// Custom Code Block Renderer (Isolated and Clean logic)
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children).replace(/\n$/, '');
    const [isCopied, setIsCopied] = useState(false);
    const isMultiLine = codeContent.split('\n').length > 1;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Compact Mode for single lines: Minimal box, no header.
    if (!inline && !isMultiLine) {
        // heuristic: if it's short (< 60 chars), render it as an inline badge to prevent breaking text flow
        if (codeContent.length < 60) {
            return (
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-nodus-green text-sm font-mono whitespace-nowrap inline-block align-middle" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <code className="block my-2 px-3 py-2 rounded-lg bg-[#09090b] border border-white/10 text-xs font-mono text-zinc-300 whitespace-pre-wrap break-all shadow-sm" {...props}>
                {children}
            </code>
        );
    }

    return !inline ? (
        <div className="relative group my-2 rounded-lg overflow-hidden border border-white/10 bg-[#09090b]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                <span className="text-[10px] text-zinc-500 font-mono">{match ? match[1] : 'code'}</span>
                <div className="flex items-center gap-2 opacity-100 transition-opacity">
                    {/* No Run button for NotebookPage */}
                    <button
                        onClick={handleCopy}
                        className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                        title="Copy Code"
                    >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
            </div>
            <div className="p-3 overflow-x-auto">
                <code className={cn("text-xs font-mono text-zinc-300 leading-relaxed", className)} {...props}>
                    {children}
                </code>
            </div>
        </div>
    ) : (
        <code className="px-1.5 py-0.5 rounded bg-white/10 text-nodus-green text-sm font-mono" {...props}>
            {children}
        </code>
    );
};
