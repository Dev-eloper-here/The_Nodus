"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Youtube, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { NoteSource } from "@/lib/types";

interface NotebookUploaderProps {
    onUploadSuccess?: (source: NoteSource) => void;
}

export default function NotebookUploader({ onUploadSuccess }: NotebookUploaderProps) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [manualText, setManualText] = useState("");
    const [showManualInput, setShowManualInput] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- PDF Upload Logic ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) {
            if (!user) alert("Please sign in to upload.");
            return;
        }

        setIsUploading(true);
        setStatus('idle');

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.uid);

        try {
            const response = await fetch("/api/notebook/upload", {
                method: "POST",
                body: formData,
            });

            let data;
            try {
                data = await response.json();
            } catch (err) {
                // If JSON fails, try text
                const text = await response.text();
                throw new Error(text || "Invalid server response");
            }

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            if (onUploadSuccess && data.source) {
                onUploadSuccess(data.source);
            }

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 3000);

        } catch (error: any) {
            console.error("Upload Error:", error);
            alert("Upload Error: " + error.message);
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    // --- YouTube Logic ---
    const handleYoutubeSubmit = async () => {
        if (!youtubeUrl.trim() || !user) {
            if (!user) alert("Please sign in.");
            return;
        }

        setIsUploading(true);
        setStatus('idle');
        // Do not clear error immediately if we are in manual mode retry

        try {
            const body = {
                url: youtubeUrl,
                userId: user.uid,
                manualText: showManualInput ? manualText : undefined
            };

            const response = await fetch("/api/notebook/youtube", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if we need manual input
                if (data.needsManualInput && !showManualInput) {
                    setShowManualInput(true);
                    throw new Error("No captions found. Please paste the transcript manually.");
                }
                throw new Error(data.error || "Failed to process video");
            }

            if (onUploadSuccess && data.source) {
                // IMPORTANT: Attach chunks so they are saved to state
                const fullSource = { ...data.source, chunks: data.chunks };
                onUploadSuccess(fullSource);
            }

            setStatus('success');
            setYoutubeUrl("");
            setManualText("");
            setShowManualInput(false);
            setTimeout(() => setStatus('idle'), 3000);

        } catch (error: any) {
            // Don't alert if we are just switching to manual input UI
            if (error.message.includes("manual") || error.message.includes("No captions")) {
                console.warn("YouTube Manual Input Triggered:", error.message);
                // Just let the UI show the input
            } else {
                console.error("YouTube Error:", error);
                alert("YouTube Error: " + error.message);
            }
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white/5 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-all flex items-center justify-center gap-2",
                        activeTab === 'upload'
                            ? "bg-white dark:bg-white/5 text-zinc-900 dark:text-white border-b-2 border-blue-500"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                    )}
                >
                    <Upload size={14} />
                    Upload PDF
                </button>
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={cn(
                        "flex-1 py-3 text-xs font-medium text-center transition-all flex items-center justify-center gap-2",
                        activeTab === 'youtube'
                            ? "bg-white dark:bg-white/5 text-red-600 dark:text-red-400 border-b-2 border-red-500"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                    )}
                >
                    <Youtube size={14} />
                    YouTube
                </button>
            </div>

            <div className="p-4 bg-white dark:bg-[#18181b]">
                {activeTab === 'upload' ? (
                    /* Existing PDF Uploader UI */
                    <>
                        <div
                            className={cn(
                                "relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                                status === 'error' ? "border-red-500/50 bg-red-500/5" :
                                    status === 'success' ? "border-green-500/50 bg-green-500/5" :
                                        "border-zinc-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5"
                            )}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />

                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2 text-zinc-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="text-xs font-medium">Processing...</span>
                                </div>
                            ) : status === 'success' ? (
                                <div className="flex flex-col items-center gap-2 text-green-500">
                                    <CheckCircle className="w-8 h-8" />
                                    <span className="text-xs font-medium">Added to Notebook</span>
                                </div>
                            ) : status === 'error' ? (
                                <div className="flex flex-col items-center gap-2 text-red-500">
                                    <AlertCircle className="w-8 h-8" />
                                    <span className="text-xs font-medium">Upload Failed</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-blue-500 transition-colors">
                                    <div className="p-3 rounded-full bg-zinc-100 dark:bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium">Click to upload PDF</span>
                                </div>
                            )}
                        </div>
                        <p className="mt-3 text-[10px] text-zinc-500 text-center">
                            Supported: PDF (Text will be embedded via Gemini 1.5)
                        </p>
                    </>
                ) : (
                    /* YouTube UI */
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">Video URL</label>
                            <div className="relative group">
                                <LinkIcon size={14} className="absolute left-3 top-2.5 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => {
                                        setYoutubeUrl(e.target.value);
                                        // Reset manual input if url changes significantly? No, keep it simple.
                                    }}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                                />
                            </div>
                        </div>

                        {showManualInput && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                <label className="text-xs font-medium text-red-500 ml-1 flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    No Captions Found. Paste Transcript (or Summary):
                                </label>
                                <textarea
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    placeholder="Paste the video transcript or a summary here..."
                                    className="w-full h-24 bg-zinc-50 dark:bg-black/20 border border-red-500/30 rounded-xl p-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-all resize-none"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleYoutubeSubmit}
                            disabled={isUploading || !youtubeUrl || (showManualInput && !manualText)}
                            className={cn(
                                "w-full py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm",
                                isUploading ? "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed" :
                                    "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 active:scale-[0.98]"
                            )}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    {showManualInput ? "Processing Text..." : "Fetching Transcript..."}
                                </>
                            ) : (
                                <>
                                    {showManualInput ? "Add Manually" : "Add Video to Notebook"}
                                    <Youtube size={14} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
