"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import CodeSandbox from "@/components/CodeSandbox";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [code, setCode] = useState<string>(`// Start coding here...
console.log('Hello, Nodus!');`);

    return (
        <main className="flex h-screen w-full bg-nodus-dark">
            {/* Left Pane - Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-white/10">
                <Sidebar />
            </div>

            {/* Middle Pane - Chat Interface */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out border-r border-white/10 flex flex-col",
                    isFocusMode ? "w-0 opacity-0 overflow-hidden" : "w-[400px] opacity-100"
                )}
            >
                <ChatInterface currentCode={code} />
            </div>

            {/* Right Pane - Code Sandbox */}
            <div className="flex-1 relative flex flex-col min-w-0">
                <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#1e1e1e]">
                    <div className="text-sm font-medium text-gray-400">Code Sandbox</div>
                    <button
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="flex items-center gap-2 text-xs font-medium text-nodus-green hover:text-green-400 transition-colors"
                    >
                        {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        {isFocusMode ? "Exit Focus" : "Focus Mode"}
                    </button>
                </header>
                <div className="flex-1 relative">
                    <CodeSandbox code={code} onChange={setCode} />
                </div>
            </div>
        </main>
    );
}
