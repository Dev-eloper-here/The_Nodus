"use client";

import Editor from "@monaco-editor/react";

export default function CodeSandbox({ code, onChange }: { code: string; onChange: (value: string) => void }) {
    return (
        <div className="h-full w-full bg-[#1e1e1e]">
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
                // Setup monaco theme to match Nodus if needed, usually vs-dark is close enough
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
    );
}
