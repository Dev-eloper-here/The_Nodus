"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import CodeSandbox from "@/components/CodeSandbox";
import { Maximize2, Minimize2 } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

export default function Home() {
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [code, setCode] = useState<string>(`// Start coding here...
console.log('Hello, Nodus!');`);

    return (
        <main className="h-screen w-full bg-nodus-dark text-white overflow-hidden font-sans flex">
            {/* Left Pane - Sidebar (Fixed) */}
            <div className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col">
                <Sidebar />
            </div>

            {/* Resizable Content (Chat + Sandbox) */}
            <div className="flex-1 min-w-0">
                <Group direction="horizontal">
                    {/* Middle Pane - Chat Interface */}
                    {!isFocusMode && (
                        <>
                            <Panel defaultSize={40} minSize={20} className="flex flex-col border-r border-white/10">
                                <ChatInterface currentCode={code} onCodeUpdate={setCode} />
                            </Panel>
                            <Separator className="w-1 bg-white/5 hover:bg-nodus-green/50 transition-colors cursor-col-resize" />
                        </>
                    )}

                    {/* Right Pane - Code Sandbox */}
                    <Panel defaultSize={60} minSize={30} className="flex flex-col">
                        <div className="h-auto border-b border-white/10 flex flex-col justify-start px-4 py-3 bg-[#1e1e1e] flex-shrink-0 gap-3">
                            <div className="text-sm font-semibold text-gray-400 truncate w-full">Code Sandbox</div>
                            <div className="flex items-center w-full">
                                <button
                                    onClick={() => setIsFocusMode(!isFocusMode)}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-nodus-green hover:text-green-400 rounded-md text-xs font-medium transition-all border border-white/5"
                                >
                                    {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                    {isFocusMode ? "Exit Focus" : "Focus Mode"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <CodeSandbox code={code} onChange={setCode} />
                        </div>
                    </Panel>
                </Group>
            </div>
        </main>
    );
}
