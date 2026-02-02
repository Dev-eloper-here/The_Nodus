"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import CodeSandbox from "@/components/CodeSandbox";
import { Maximize2, Minimize2 } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

import { useChatStore } from "@/lib/store";

export default function Home() {
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Use Global Store for Code (Logic Sync)
    const { editorCode, setEditorCode } = useChatStore();

    return (
        <main className="h-screen w-full bg-white dark:bg-nodus-dark text-zinc-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
            {/* Main Panel Group wrapping everything */}
            <Group direction="horizontal" className="h-full w-full">

                {/* Left Pane - Sidebar */}
                {/* FIXED: All sizes must be strings to be percentages. Numeric 30 = 30px! */}
                <Panel defaultSize="20" minSize="15" maxSize="30" className="bg-white dark:bg-[#18181b] flex flex-col h-full border-r border-zinc-200 dark:border-white/5 transition-colors duration-300">
                    <Sidebar />
                </Panel>

                {/* Separator Handle 1 */}
                <Separator className="w-2 -ml-1 hover:w-2 hover:-ml-1 bg-transparent hover:bg-nodus-green/20 cursor-col-resize transition-all z-50 flex items-center justify-center relative">
                    <div className="w-[1px] h-full bg-zinc-200 dark:bg-white/10" />
                </Separator>

                {/* Resizable Content (Chat + Sandbox) */}
                <Panel defaultSize="80" className="h-full">
                    <Group direction="horizontal" className="h-full w-full">
                        {/* Middle Pane - Chat Interface */}
                        {!isFocusMode && (
                            <>
                                <Panel defaultSize="40" minSize="20" className="flex flex-col h-full border-r border-zinc-200 dark:border-white/5 transition-colors duration-300">
                                    <ChatInterface currentCode={editorCode} onCodeUpdate={setEditorCode} />
                                </Panel>
                                <Separator className="w-2 -ml-1 hover:w-2 hover:-ml-1 bg-transparent hover:bg-nodus-green/20 cursor-col-resize transition-all z-50 flex items-center justify-center relative">
                                    <div className="w-[1px] h-full bg-zinc-200 dark:bg-white/10" />
                                </Separator>
                            </>
                        )}

                        {/* Right Pane - Code Sandbox */}
                        <Panel defaultSize="60" minSize="30" className="flex flex-col h-full">
                            {/* Old Header Removed - Functionality moved to internal floating buttons */}
                            <div className="flex-1 relative overflow-hidden">
                                <CodeSandbox
                                    code={editorCode}
                                    onChange={setEditorCode}
                                    isFocusMode={isFocusMode}
                                    onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                                />
                            </div>
                        </Panel>
                    </Group>
                </Panel>
            </Group>
        </main>
    );
}
