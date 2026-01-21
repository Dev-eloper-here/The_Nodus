"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

interface Message {
    role: "user" | "ai";
    content: string;
}

export default function ChatInterface({ currentCode }: { currentCode?: string }) {
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

            if (!response.ok) throw new Error("Failed to fetch response");

            const data = await response.json();
            setMessages(prev => [...prev, { role: "ai", content: data.response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "ai", content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
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
                        <div className={`space-y-2 max-w-[80%]`}>
                            <div className={`p-4 rounded-2xl border ${msg.role === 'ai'
                                ? 'bg-[#1e1e1e] rounded-tl-none border-white/5'
                                : 'bg-nodus-green/10 rounded-tr-none border-nodus-green/20'
                                }`}>
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </p>
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
