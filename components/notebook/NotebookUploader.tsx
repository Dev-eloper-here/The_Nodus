
"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

import { NoteSource } from "@/lib/types";

interface NotebookUploaderProps {
    onUploadSuccess?: (source: NoteSource) => void;
}



// ...

export default function NotebookUploader({ onUploadSuccess }: NotebookUploaderProps) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            console.log("NotebookUploader: Starting upload...", file.name);
            const response = await fetch("/api/notebook/upload", {
                method: "POST",
                body: formData,
            });

            console.log("NotebookUploader: Response status", response.status);

            // Try to parse JSON regardless of status to get error message
            let data;
            const textResponse = await response.text();
            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                console.error("NotebookUploader: Failed to parse JSON response:", textResponse);
                throw new Error("Server returned invalid response: " + textResponse.substring(0, 100));
            }

            if (!response.ok) {
                console.error("NotebookUploader: Upload failed", data);
                throw new Error(data.error || "Upload failed with status " + response.status);
            }

            console.log("NotebookUploader: Success", data);

            if (onUploadSuccess && data.source) {
                onUploadSuccess(data.source);
            }

            setStatus('success');
            // Reset after 3 seconds
            setTimeout(() => {
                setStatus('idle');
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 3000);

        } catch (error: any) {
            console.error("NotebookUploader Error:", error);
            // Alert the user (simple alert for now, or could use toast if available)
            alert("Upload Error: " + error.message);
            setStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 bg-nodus-gray/50 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-200">Notebook Sources</h3>
                <span className="text-xs text-nodus-green bg-nodus-green/10 px-2 py-0.5 rounded-full">
                    RAG Active
                </span>
            </div>

            <div
                className={cn(
                    "relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    status === 'error' ? "border-red-500/50 bg-red-500/5" :
                        status === 'success' ? "border-green-500/50 bg-green-500/5" :
                            "border-white/10 hover:border-nodus-green/50 hover:bg-white/5"
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
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs">Processing PDF...</span>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center gap-2 text-green-400">
                        <CheckCircle className="w-8 h-8" />
                        <span className="text-xs">Added to Notebook</span>
                    </div>
                ) : status === 'error' ? (
                    <div className="flex flex-col items-center gap-2 text-red-400">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-xs">Upload Failed</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-300">
                        <Upload className="w-8 h-8" />
                        <span className="text-xs">Click to upload PDF</span>
                    </div>
                )}
            </div>

            <p className="mt-2 text-[10px] text-gray-500 text-center">
                Supported: PDF (Text will be embedded via Gemini)
            </p>
        </div>
    );
}
