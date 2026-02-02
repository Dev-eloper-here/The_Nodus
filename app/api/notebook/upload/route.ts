
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { embedText, fileManager, genAI, MODEL_NAME } from "@/lib/gemini";
import pdfParse from "pdf-parse";
import { NoteSource, NoteChunk } from "@/lib/types";
import fs from "fs";
import path from "path";
import os from "os";

// Force Node.js runtime for file handling & generic fs ops
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: Chunk text
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;
        if (end < text.length) {
            const nextSpace = text.indexOf(' ', end);
            const nextNewline = text.indexOf('\n', end);
            if (nextNewline !== -1 && nextNewline - end < 100) {
                end = nextNewline;
            } else if (nextSpace !== -1 && nextSpace - end < 50) {
                end = nextSpace;
            }
        }
        chunks.push(text.slice(start, end));
        start = end - overlap;
    }
    return chunks;
}

export async function POST(request: NextRequest) {
    console.log("Upload API: Received request");

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!userId) return NextResponse.json({ error: "Unauthorized: Missing User ID" }, { status: 401 });
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
        if (file.size > 9.5 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 9.5MB." }, { status: 400 });
        if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files supported" }, { status: 400 });

        // 1. Read File
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`Upload API: Processing ${file.name} (${file.size} bytes)`);

        // 2. Initial Parse (pdf-parse)
        let fullText = "";
        try {
            const data = await pdfParse(buffer);
            fullText = data.text;
            console.log("Upload API: pdf-parse length:", fullText.length);
        } catch (e) {
            console.warn("Upload API: pdf-parse failed, likely scanned.", e);
        }

        // 3. Smart Fallback: If text is suspiciously short (< 100 chars), use Gemini OCR
        if (fullText.trim().length < 100) {
            console.log("Upload API: Text too short. Switching to Gemini OCR...");

            // Create temp file for upload
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `upload-${Date.now()}.pdf`);
            fs.writeFileSync(tempFilePath, buffer);

            try {
                // Upload to Gemini
                const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                    mimeType: "application/pdf",
                    displayName: file.name,
                });
                console.log(`Upload API: Uploaded to Gemini: ${uploadResponse.file.uri}`);

                // Prompt Gemini for Transcription
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const result = await model.generateContent([
                    {
                        fileData: {
                            mimeType: uploadResponse.file.mimeType,
                            fileUri: uploadResponse.file.uri
                        }
                    },
                    { text: "Transcribe the full text content of this PDF document exactly as it appears. output plain text only." }
                ]);

                fullText = result.response.text();
                console.log("Upload API: OCR Text length:", fullText.length);

                // Cleanup temp file
                fs.unlinkSync(tempFilePath);

            } catch (ocrError: any) {
                console.error("Upload API: Gemini OCR failed", ocrError);
                return NextResponse.json({ error: "Failed to read scanned PDF: " + ocrError.message }, { status: 500 });
            }
        }

        if (!fullText || fullText.trim().length === 0) {
            return NextResponse.json({ error: "Could not extract any text from this file." }, { status: 400 });
        }

        // 4. Create Source & Embed
        const sourceRef = doc(collection(db, "sources"));

        // Define sourceData with explicit type including userId
        const sourceData: NoteSource & { userId: string } = {
            id: sourceRef.id,
            title: file.name.replace(".pdf", ""),
            fileName: file.name,
            type: 'pdf',
            createdAt: Date.now(),
            chunkCount: 0,
            userId: userId
        };

        await setDoc(sourceRef, sourceData);

        const chunks = chunkText(fullText);
        sourceData.chunkCount = chunks.length;
        await setDoc(sourceRef, sourceData);

        console.log(`Upload API: Embedding ${chunks.length} chunks...`);

        // Serialized batching to avoid rate limits
        const subCollectionRef = collection(db, "sources", sourceRef.id, "chunks");
        for (let i = 0; i < chunks.length; i++) {
            const text = chunks[i];
            const embedding = await embedText(text);
            await addDoc(subCollectionRef, {
                id: `${sourceRef.id}_${i}`,
                sourceId: sourceRef.id,
                text: text,
                embedding: embedding,
                index: i
            });
        }

        console.log("Upload API: Success");

        // Log Activity for Streak
        if (userId) {
            const { logActivity } = await import("@/lib/gamification");
            await logActivity(userId);
        }

        return NextResponse.json({ success: true, source: sourceData });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
    }
}
