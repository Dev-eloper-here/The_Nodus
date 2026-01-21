
import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL, openai, OPENAI_MODEL, AI_PROVIDER } from "@/lib/ai";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, query, where, limit } from "firebase/firestore";
import { cosineSimilarity } from "@/lib/vector";

// Helper: Fetch Unresolved Errors (Proactive Mentoring)
async function fetchActiveErrors() {
    const q = query(collection(db, "errors"), where("resolved", "==", false), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => d.data().title).join(", ");
}

// Helper: RAG Retrieval
async function retrieveRelevantContext(message: string, sourceIds: string[]) {
    // 1. Embed string
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(message);
    const queryVector = result.embedding.values;

    // 2. Fetch all chunks from active sources
    // Note: In production, use Vector Search (e.g. Pinecone or Firestore Vector Search)
    // For Hackathon prototype with small docs, brute-force client-side cosine similarity is fine.
    let allChunks: any[] = [];

    for (const sourceId of sourceIds) {
        const chunksRef = collection(db, "sources", sourceId, "chunks");
        const snapshot = await getDocs(chunksRef);
        snapshot.forEach((doc: any) => {
            allChunks.push(doc.data());
        });
    }

    if (allChunks.length === 0) return "";

    // 3. Rank
    const ranked = allChunks.map(chunk => ({
        text: chunk.text,
        score: cosineSimilarity(queryVector, chunk.embedding)
    })).sort((a, b) => b.score - a.score);

    // 4. Select Top K
    const topK = ranked.slice(0, 5);
    return topK.map(c => c.text).join("\n\n---\n\n");
}

export async function POST(request: NextRequest) {
    try {
        const { message, sources, context } = await request.json();

        // --- OPENAI LOGIC ---
        if (AI_PROVIDER === 'openai') {
            // ... (Keep existing simple logic or update similarly if needed)
            // For brevity, keeping simple as user focused on Gemini
            // ...
            // (Truncated for this edit, will keep standard OpenAI fallback)
            // Actually, I should just copy the previous logic or standard completion
            const completion = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [{ role: 'system', content: "You are Sage." }, { role: 'user', content: message }],
                stream: true,
            });
            // ... (Stream logic)
            const stream = new ReadableStream({
                async start(controller) {
                    for await (const chunk of completion) {
                        const text = chunk.choices[0]?.delta?.content || "";
                        if (text) controller.enqueue(new TextEncoder().encode(text));
                    }
                    controller.close();
                }
            });
            return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }

        // import { GenAI, ... } handled in header
        // vertexModel removed from imports

        /*
        // --- VERTEX AI LOGIC ---
        if (AI_PROVIDER === 'vertex') {
             // ... Vertex logic commented out as package @google-cloud/vertexai is missing in package.json
             // and vertexModel is not exported from lib/ai.ts
             return NextResponse.json({ error: "Vertex AI not valid in this build." }, { status: 500 });
        }
        */

        // --- GEMINI LOGIC (Primary) ---
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        let finalPrompt = message;

        // 1. Add Code Context (Sandbox)
        if (context) {
            finalPrompt = `CONTEXT (User's Code Editor):\n\`\`\`${context}\`\`\`\n\nUSER QUESTION: ${message}`;
        }

        // 2. Add RAG Context (Notebook Sources)
        if (sources && sources.length > 0) {
            // Filter sources that are from our new upload system (have IDs)
            const sourceIds = sources.filter((s: any) => s.id).map((s: any) => s.id);

            if (sourceIds.length > 0) {
                console.log("Retrieving RAG context for sources:", sourceIds);
                const ragText = await retrieveRelevantContext(message, sourceIds);
                if (ragText) {
                    finalPrompt = `CONTEXT (Retrieved from User's Notes):\n${ragText}\n\n${finalPrompt}`;
                }
            }
        }

        // 3. Add Error Wallet Context (Proactive Mentoring)
        const activeErrors = await fetchActiveErrors();
        if (activeErrors) {
            finalPrompt = `SYSTEM NOTE: The user has a history of these errors: [${activeErrors}]. If their code shows signs of this, warn them gently.\n\n${finalPrompt}`;
        }

        const result = await model.generateContentStream(finalPrompt);

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    controller.enqueue(new TextEncoder().encode(chunkText));
                }
                controller.close();
            }
        });

        return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

    } catch (error: any) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
