"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Play, Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface ChatInterfaceProps {
    currentCode?: string;
    onCodeUpdate?: (code: string) => void;
}

export default function ChatInterface({ currentCode, onCodeUpdate }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hello! I'm Sage, your coding tutor. I see you're starting a new project. How can I assist you today?"
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const { user } = useAuth(); // Get authenticated user

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage, context: currentCode }),
            });

            if (!response.body) throw new Error("No response body");

            // Add placeholder for AI response
            setMessages(prev => [...prev, { role: "ai", content: "" }]);

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
                            // Optional: Alert user it happened (or just let it happen silently)
                            // Ideally, replace the command block with a UI confirmation, but for now just remove it.
                        }
                    } catch (e) {
                        console.error("Failed to execute AI wallet command", e);
                    }

                    // Remove command from display
                    accumulatedText = accumulatedText.replace(match[0], "\n\n*(Item saved to Wallet)*");
                }

                // Update last message
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = accumulatedText;
                    return newMsgs;
                });
            }
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: "ai", content: `Error: ${error.message || "Unknown error"}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom Code Block Renderer
    const CodeBlock = ({ inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const codeContent = String(children).replace(/\n$/, '');
        const [isCopied, setIsCopied] = useState(false);

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

        return !inline ? (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 bg-[#09090b]">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">{match ? match[1] : 'code'}</span>
                    <div className="flex items-center gap-2">
                        {onCodeUpdate && (
                            <button
                                onClick={handleRun}
                                className="flex items-center gap-1.5 text-xs text-nodus-green hover:text-green-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                                title="Put this code in Editor"
                            >
                                <Play size={12} />
                                Run in Editor
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                            title="Copy Code"
                        >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>
                <div className="p-4 overflow-x-auto">
                    <code className={cn("text-sm font-mono text-zinc-300", className)} {...props}>
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

    return (
        <div className="flex flex-col h-full bg-[#121212]">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-[#18181b]">
                <Bot className="text-nodus-green mr-3" size={24} />
                <div>
                    <h2 className="text-sm font-semibold text-white">Sage Agent</h2>
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
                            <div className={`p-4 rounded-2xl border ${msg.role === 'ai'
                                ? 'bg-[#1e1e1e] rounded-tl-none border-white/5'
                                : 'bg-nodus-green/10 rounded-tr-none border-nodus-green/20'
                                }`}>
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code: CodeBlock
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
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
            <div className="p-4 bg-[#18181b] border-t border-white/10">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Ask Sage a question..."
                        disabled={isLoading}
                        className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-nodus-green/50 transition-colors placeholder:text-zinc-600 disabled:opacity-50"
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
