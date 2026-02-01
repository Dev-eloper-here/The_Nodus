"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Terminal, Play, ChevronDown, ChevronUp, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const LANGUAGES = [
    { id: "typescript", name: "TypeScript / JS (Local)", version: "local", piston: null },
    { id: "javascript", name: "JavaScript (Local)", version: "local", piston: null },
    { id: "python", name: "Python (Piston)", version: "3.10.0", piston: "python" },
    { id: "c", name: "C (Piston)", version: "10.2.0", piston: "c" },
    { id: "cpp", name: "C++ (Piston)", version: "10.2.0", piston: "c++" },
];

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
    const [language, setLanguage] = useState(LANGUAGES[0]); // Default TS
    const [isRunning, setIsRunning] = useState(false);
    const { theme } = useTheme(); // Get current theme
    const [monacoInstance, setMonacoInstance] = useState<any>(null);

    // Auto-detect Language
    useEffect(() => {
        const lines = code.split('\n').slice(0, 10).join('\n'); // Check first 10 lines

        if (lines.includes("#include <") || lines.includes("int main")) {
            if (lines.includes("<iostream>") || lines.includes("std::")) {
                setLanguage(LANGUAGES.find(l => l.id === "cpp") || LANGUAGES[0]);
            } else {
                setLanguage(LANGUAGES.find(l => l.id === "c") || LANGUAGES[0]);
            }
        } else if (lines.includes("def ") || lines.includes("import ") || (lines.includes("print(") && !lines.includes("console.log"))) {
            setLanguage(LANGUAGES.find(l => l.id === "python") || LANGUAGES[0]);
        } else if (lines.includes("console.log") || lines.includes("const ") || lines.includes("let ") || lines.includes("function ")) {
            setLanguage(LANGUAGES.find(l => l.id === "javascript") || LANGUAGES[0]);
        }
    }, [code]);

    // Update Monaco Theme when 'theme' changes
    useEffect(() => {
        if (monacoInstance) {
            monacoInstance.editor.setTheme(theme === 'dark' ? 'nodus-theme' : 'light');
        }
    }, [theme, monacoInstance]);

    const runCode = async () => {
        setIsConsoleOpen(true);
        setIsRunning(true);
        setOutput([`> Running code (${language.name})...`]);

        try {
            // 1. Local Execution (JS/TS)
            if (!language.piston) {
                // Create a "Sandbox" scope
                const logs: string[] = [];
                const customConsole = {
                    log: (...args: any[]) => {
                        const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
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

                const wrappedCode = `
                    return (async () => {
                        ${code}
                    })();
                `;

                // Quick TS compiled to JS strip (naive)
                // In a real app, we'd use swc-wasm, but for this simple sandbox, raw execution functions for simple snippets.
                // NOTE: Piston or a Bundler is better for complex TS, but for "Coding Tutor" purposes, users usually type valid JS-compatible logic or we should switch TS to Piston too if robustness is needed.
                // For now, allow valid JS execution.
                const run = new Function('console', wrappedCode);
                await run(customConsole);
                setOutput(prev => [...prev, `> Done.`]);
            }

            // 2. Remote Execution (Piston API)
            else {
                const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: language.piston,
                        version: language.version,
                        files: [{ content: code }]
                    })
                });

                const data = await response.json();

                if (data.run) {
                    // Stdout
                    if (data.run.stdout) {
                        setOutput(prev => [...prev, ...data.run.stdout.split('\n')]);
                    }
                    // Stderr
                    if (data.run.stderr) {
                        setOutput(prev => [...prev, `Error: ${data.run.stderr}`]);
                    }
                    if (data.run.output && !data.run.stdout && !data.run.stderr) {
                        setOutput(prev => [...prev, data.run.output]);
                    }

                    setOutput(prev => [...prev, `> Exited with code ${data.run.code}`]);
                } else {
                    setOutput(prev => [...prev, `> Error: Failed to execute via Piston API.`]);
                }
            }

        } catch (error: any) {
            setOutput(prev => [...prev, `> Runtime Error: ${error.message}`]);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] relative group transition-colors duration-300">

            {/* Header / Toolbar Section */}
            <div className="flex flex-col border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] px-4 py-3 gap-3 flex-shrink-0 transition-colors duration-300">
                {/* 1. Title Line & Language Selector */}
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-gray-200">
                        Code Sandbox
                    </div>
                </div>

                {/* 2. Buttons Row */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleFocus}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-medium border border-zinc-200 dark:border-white/10 transition-all shadow-sm"
                    >
                        {isFocusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        {isFocusMode ? "Exit Focus" : "Focus Mode"}
                    </button>

                    {/* Language Dropdown (Moved Here) */}
                    <select
                        value={language.id}
                        onChange={(e) => {
                            const selected = LANGUAGES.find(l => l.id === e.target.value);
                            if (selected) setLanguage(selected);
                        }}
                        className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-300 text-xs rounded border border-zinc-200 dark:border-white/10 px-2 py-1 outline-none focus:border-nodus-green/50"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-medium border border-green-500/30 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                        {isRunning ? "Running..." : "Run Code"}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative min-h-0">
                <Editor
                    height="100%"
                    language={language.id === "c" || language.id === "cpp" ? "c" : language.id} // Monaco language map
                    value={code}
                    onChange={(value) => onChange(value || "")}
                    // Removed 'theme' prop to avoid conflict, managed via useEffect
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
                        setMonacoInstance(monaco);
                        // Initially set the theme to avoid flash
                        monaco.editor.setTheme(theme === 'dark' ? 'nodus-theme' : 'light');
                    }}
                />
            </div>

            {/* Output Panel / Terminal */}
            <div className={cn(
                "border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181b] flex flex-col transition-all duration-300",
                isConsoleOpen ? "h-48" : "h-9"
            )}>
                <div
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border-b border-zinc-200 dark:border-white/5"
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                >
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <Terminal size={14} />
                        Console Output
                    </div>
                    {isConsoleOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronUp size={14} className="text-zinc-500" />}
                </div>

                {isConsoleOpen && (
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-800 dark:text-zinc-300 space-y-1">
                        {output.length === 0 && <span className="text-zinc-500 dark:text-zinc-600 italic">No output yet...</span>}
                        {output.map((line, i) => (
                            <div key={i} className="border-b border-zinc-200 dark:border-white/5 last:border-0 pb-1 mb-1 break-all whitespace-pre-wrap">{line}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
