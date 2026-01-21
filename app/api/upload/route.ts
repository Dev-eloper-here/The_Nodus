
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Ensure this path is correct
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";

// Initialize Gemini for Embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Helper to chunk text
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`Processing file: ${file.name} (${file.type})`);

        // 1. Read File Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Extract Text (assuming PDF for now)
        let text = "";
        if (file.type === "application/pdf") {
            const pdfData = await pdfParse(buffer);
            text = pdfData.text;
        } else {
            // Fallback for simple text files
            text = buffer.toString('utf-8');
        }

        // 3. Create Source Document in Firestore
        const sourceRef = await addDoc(collection(db, "sources"), {
            name: file.name,
            mimeType: file.type,
            createdAt: new Date(),
            status: "processing" // Mark as processing
        });

        // 4. Chunk & Embed
        const chunks = chunkText(text);
        console.log(`Generated ${chunks.length} chunks.`);

        const batchPromises = chunks.map(async (chunk, index) => {
            // Generate Embedding
            const result = await embeddingModel.embedContent(chunk);
            const vector = result.embedding.values;

            // Store Chunk in Subcollection
            return addDoc(collection(db, "sources", sourceRef.id, "chunks"), {
                text: chunk,
                embedding: vector, // Store vector for retrieval
                index: index
            });
        });

        await Promise.all(batchPromises);

        // 5. Update Status
        await updateDoc(sourceRef, { status: "ready" });

        return NextResponse.json({
            success: true,
            file: {
                id: sourceRef.id,
                name: file.name,
                mimeType: file.type
            }
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
