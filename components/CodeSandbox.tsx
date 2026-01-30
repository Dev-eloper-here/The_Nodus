"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Terminal, Play, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CodeSandbox({
    code,
    onChange,
    isFocusMode,
    onToggleFocus
}: {
    code: string;
    onChange: (value: string) => void;
    isFocusMode: boolean;
    onToggleFocus: () => void;
}) {
    const [output, setOutput] = useState<string[]>([]);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);

    const runCode = async () => {
        setIsConsoleOpen(true);
        setOutput([`> Running code...`]);

        try {
            // Create a "Sandbox" scope
            // We capture logs by passing a custom 'console' object into the function scope
            const logs: string[] = [];

            const customConsole = {
                log: (...args: any[]) => {
                    // Convert args to strings and store them
                    const line = args.map(a =>
                        typeof a === 'object' ? JSON.stringify(a) : String(a)
                    ).join(' ');

                    // Update state immediately for realtime feel
                    setOutput(prev => [...prev, line]);
                },
                error: (...args: any[]) => {
                    const line = args.map(a => String(a)).join(' ');
                    setOutput(prev => [...prev, `Error: ${line}`]);
                },
                warn: (...args: any[]) => {
                    const line = args.map(a => String(a)).join(' ');
                    setOutput(prev => [...prev, `Warning: ${line}`]);
                }
            };

            // Wrap code in an async function to support 'await' (top-level await feel)
            // We shadow the global 'console' with our 'customConsole'
            const wrappedCode = `
                return (async () => {
                    ${code}
                })();
            `;

            // Create function with injected dependencies
            // param names: 'console'
            const run = new Function('console', wrappedCode);

            // Execute
            await run(customConsole);

            setOutput(prev => [...prev, `> Done.`]);

        } catch (error: any) {
            setOutput(prev => [...prev, `> Runtime Error: ${error.message}`]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] relative group">

            {/* Header / Toolbar Section (Based on Sketch) */}
            <div className="flex flex-col border-b border-white/10 bg-[#1e1e1e] px-4 py-3 gap-3 flex-shrink-0">
                {/* 1. Title Line */}
                <div className="text-sm font-semibold text-gray-200">
                    Code Sandbox
                </div>

                {/* 2. Buttons Row */}
                <div className="flex items-center gap-3">
                    {/* Focus Mode Button */}
                    <button
                        onClick={onToggleFocus}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium border border-white/10 transition-all shadow-sm"
                    >
                        {isFocusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        {isFocusMode ? "Exit Focus" : "Focus Mode"}
                    </button>

                    {/* Run Code Button */}
                    <button
                        onClick={runCode}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-medium border border-green-500/30 transition-all shadow-sm"
                    >
                        <Play size={12} fill="currentColor" />
                        Run Code
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative min-h-0">
                <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    value={code}
                    onChange={(value) => onChange(value || "")}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16 },
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        renderLineHighlight: "all",
                    }}
                    onMount={(editor, monaco) => {
                        monaco.editor.defineTheme('nodus-theme', {
                            base: 'vs-dark',
                            inherit: true,
                            rules: [],
                            colors: {
                                'editor.background': '#1e1e1e',
                            }
                        });
                        monaco.editor.setTheme('nodus-theme');
                    }}
                />
            </div>

            {/* Output Panel / Terminal */}
            <div className={cn(
                "border-t border-white/10 bg-[#18181b] flex flex-col transition-all duration-300",
                isConsoleOpen ? "h-48" : "h-9"
            )}>
                <div
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                >
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Terminal size={14} />
                        Console Output
                    </div>
                    {isConsoleOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronUp size={14} className="text-zinc-500" />}
                </div>

                {isConsoleOpen && (
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-300 space-y-1">
                        {output.length === 0 && <span className="text-zinc-600 italic">No output yet...</span>}
                        {output.map((line, i) => (
                            <div key={i} className="border-b border-white/5 last:border-0 pb-1 mb-1 break-all whitespace-pre-wrap">{line}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
