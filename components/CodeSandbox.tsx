"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Terminal, Play, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CodeSandbox({ code, onChange }: { code: string; onChange: (value: string) => void }) {
    const [output, setOutput] = useState<string[]>([]);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);

    const runCode = () => {
        const logs: string[] = [];
        const originalLog = console.log;

        // Capture console.log
        console.log = (...args) => {
            logs.push(args.map(arg => String(arg)).join(' '));
        };

        try {
            // Simple eval for now - purely for demonstration
            // In a real app, use a sandboxed iframe or VM
            // eslint-disable-next-line no-eval
            eval(code);
            setOutput(prev => [`> Running code...`, ...logs, ...prev]);
        } catch (error: any) {
            setOutput(prev => [`> Error: ${error.message}`, ...prev]);
        } finally {
            console.log = originalLog; // Restore
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Toolbar inside component to control local actions */}
            <div className="h-auto border-b border-white/5 flex flex-col justify-start px-4 py-3 bg-[#1e1e1e]/50 flex-shrink-0 gap-3">
                <span className="text-xs font-medium text-zinc-500 truncate w-full">TypeScript Environment</span>
                <div className="flex items-center w-full">
                    <button
                        onClick={runCode}
                        className="flex items-center justify-center gap-2 w-full px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 rounded-md text-xs font-medium border border-green-600/20 transition-all"
                    >
                        <Play size={12} fill="currentColor" />
                        Run Code
                    </button>
                </div>
            </div>

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
                            <div key={i} className="border-b border-white/5 last:border-0 pb-1 mb-1">{line}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
