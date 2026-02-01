"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Play, Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useChatStore, Message } from "@/lib/store";
import WalletSuggestion from "@/components/wallet/WalletSuggestion";
import { parseWalletSuggestion } from "@/lib/messageParser";

// interface Message removed as it's now imported from store

interface ChatInterfaceProps {
    currentCode?: string;
    onCodeUpdate?: (code: string) => void;
}

export default function ChatInterface({ currentCode, onCodeUpdate }: ChatInterfaceProps) {
    // Global Store
    const { messages, addMessage, setMessages, currentThreadId, setCurrentThreadId } = useChatStore();
    const { user } = useAuth(); // Get authenticated user

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length === 0 && !isLoading) {
            setMessages([{
                role: "ai",
                content: "Hi! I'm Sage. How can I help you coding today? 🚀"
            }]);
        }
    }, [messages.length, isLoading, setMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Import DB functions (Dynamically imported to avoid server/client issues if needed, but standard import is fine here)
    // We need to import these at top level, but for this replacement block I'll assume they are imported.
    // Wait, I need to add imports to the top of the file first.

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessageContent = inputValue.trim();
        setInputValue("");

        // Add User Message to Store
        const userMsg: Message = { role: "user", content: userMessageContent };
        addMessage(userMsg);

        setIsLoading(true);
        let activeThreadId = currentThreadId;

        try {
            // 1. Create Thread if not exists (and user is logged in)
            if (!activeThreadId && user) {
                // Generate a simple title from the first 5 words
                const title = userMessageContent.split(' ').slice(0, 5).join(' ') + "...";
                // We need to import createThread. I will add imports in a separate step or assume I can add them here if I replace the whole file? 
                // No, replace_file_content replaces a block. I should do imports separately.
                // For now, I'll use the imported functions assuming they are there.
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
                await addMessageToThread(activeThreadId, 'user', userMessageContent);
            }

            // Send FULL history + current message
            // We construct the history from the store's current messages
            const historyPayload = [...messages, userMsg];

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessageContent,
                    history: historyPayload,
                    context: currentCode
                }),
            });

            if (!response.body) throw new Error("No response body");

            // Add placeholder for AI response
            const aiMsg: Message = { role: "ai", content: "" };
            addMessage(aiMsg);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                accumulatedText += text;

                // Check for Command Block :::SAVE_WALLET={...}:::
                // Using [\s\S] instead of dot with /s flag for broader TS target compatibility
                const commandRegex = /:::SAVE_WALLET=([\s\S]*?):::/;
                const match = accumulatedText.match(commandRegex);

                if (match) {
                    const jsonString = match[1];
                    try {
                        const walletData = JSON.parse(jsonString);

                        // Execute Save
                        if (user) {
                            await fetch("/api/wallet", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...walletData, userId: user.uid })
                            });
                        }
                    } catch (e) {
                        console.error("Failed to execute AI wallet command", e);
                    }

                    // Remove command from display
                    accumulatedText = accumulatedText.replace(match[0], "\n\n*(Item saved to Wallet)*");
                }

                // Update last message (AI response)
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = accumulatedText;
                    return newMsgs;
                });
            }

            // 3. Save AI Message to Firestore (Final)
            if (activeThreadId && user) {
                const { addMessageToThread } = await import("@/lib/db");
                await addMessageToThread(activeThreadId, 'ai', accumulatedText);
            }

        } catch (error: any) {
            console.error(error);
            addMessage({ role: "ai", content: `Error: ${error.message || "Unknown error"}` });
        } finally {
            setIsLoading(false);
        }
    };

    // Custom Code Block Renderer
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

        const handleRun = () => {
            if (onCodeUpdate) {
                onCodeUpdate(codeContent);
            }
        };

        // If it's a block (triple backticks) but only one line, check length
        // heuristic: if it's short (< 60 chars), render it as an inline badge to prevent breaking text flow
        if (!inline && !isMultiLine) {
            if (codeContent.length < 60) {
                return (
                    <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-nodus-green text-sm font-mono whitespace-nowrap inline-block align-middle" {...props}>
                        {children}
                    </code>
                );
            }

            // Longer single lines (e.g. commands) get the compact block
            return (
                <code className="block my-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all shadow-sm" {...props}>
                    {children}
                </code>
            );
        }

        return !inline ? (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#09090b]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-white/10 border-b border-zinc-200 dark:border-white/10">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{match ? match[1] : 'code'}</span>
                    <div className="flex items-center gap-2 opacity-100 transition-opacity">
                        {onCodeUpdate && (
                            <button
                                onClick={handleRun}
                                className="flex items-center gap-1.5 text-[10px] text-nodus-green hover:text-green-600 dark:hover:text-green-400 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-white/5"
                                title="Put this code in Editor"
                            >
                                <Play size={10} />
                                Run
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/5"
                            title="Copy Code"
                        >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>
                <div className="p-3 overflow-x-auto">
                    <code className={cn("text-xs font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed", className)} {...props}>
                        {children}
                    </code>
                </div>
            </div>
        ) : (
            <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-nodus-green text-sm font-mono" {...props}>
                {children}
            </code>
        );
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#121212] transition-colors duration-300">
            {/* Header */}
            <div className="h-14 border-b border-zinc-200 dark:border-white/10 flex items-center px-6 bg-white dark:bg-[#18181b] transition-colors duration-300">
                <Bot className="text-nodus-green mr-3" size={24} />
                <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Sage Agent</h2>
                    <p className="text-xs text-zinc-500">Always here to help</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-white/10' : 'bg-nodus-green/20'}`}>
                            {msg.role === 'ai' ? (
                                <Bot size={16} className="text-nodus-green" />
                            ) : (
                                <User size={16} className="text-nodus-green" />
                            )}
                        </div>
                        <div className={`space-y-2 max-w-[85%]`}>
                            <div className={`p-4 rounded-2xl border transition-colors duration-300 ${msg.role === 'ai'
                                ? 'bg-white dark:bg-[#1e1e1e] rounded-tl-none border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none'
                                : 'bg-nodus-green/10 rounded-tr-none border-nodus-green/20'
                                }`}>
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code: CodeBlock
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
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-nodus-green" />
                        </div>
                        <div className="bg-[#1e1e1e] p-4 rounded-2xl rounded-tl-none border border-white/5">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75" />
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#18181b] border-t border-zinc-200 dark:border-white/10 transition-colors duration-300">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Ask Sage a question..."
                        disabled={isLoading}
                        className="w-full bg-zinc-100 dark:bg-[#09090b] border border-transparent dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-nodus-green/50 focus:bg-white dark:focus:bg-[#09090b] transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-600 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-nodus-green rounded-lg text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
