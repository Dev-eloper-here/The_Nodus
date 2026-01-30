
import { NextRequest, NextResponse } from "next/server";
import { genAI as chatGenAI, GEMINI_MODEL } from "@/lib/ai";
import { embedText } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, query, where, limit } from "firebase/firestore";
import { cosineSimilarity } from "@/lib/vector";
import { NoteSource, NoteChunk } from "@/lib/types";
import { Content } from "@google/generative-ai";

// Helper: Fetch Unresolved Errors (Proactive Mentoring)
async function fetchActiveErrors() {
    const q = query(collection(db, "errors"), where("resolved", "==", false), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => d.data().title).join(", ");
}

// Helper: RAG Retrieval
async function retrieveRelevantContext(message: string, sourceIds: string[]) {
    // 1. Embed string
    const queryVector = await embedText(message);

    // 2. Fetch all chunks from active sources
    // Note: In real app, use Vector Search. For MVP, fetch all and cosine locally.
    let allChunks: NoteChunk[] = [];

    for (const sourceId of sourceIds) {
        const chunksRef = collection(db, "sources", sourceId, "chunks");
        const snapshot = await getDocs(chunksRef);
        snapshot.forEach((doc: any) => {
            allChunks.push(doc.data() as NoteChunk);
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
        const { message, history, sources, context, enableWebSearch } = await request.json();

        // --- GEMINI LOGIC (API Key) ---
        const model = chatGenAI.getGenerativeModel({ model: GEMINI_MODEL });

        // CONSTRUCT HISTORY FOR GEMINI (Multi-turn)
        // Convert store history [{role: 'user', content: 'hi'}] -> Gemini history [{role: 'user', parts: [{text: 'hi'}]}]
        // Exclude the CURRENT message from history, as it's sent via sendMessage
        let geminiHistory: Content[] = (history || [])
            .slice(0, -1) // Remove the very last message which is the current one we are processing
            .map((msg: any) => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        // Gemini Requirement: History must start with 'user' and be alternating.
        // If the first message is 'model' (e.g. welcome message), remove it.
        if (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
            geminiHistory.shift();
        }

        // TOOL CONFIGURATION (Web Search)
        const tools = [];
        if (enableWebSearch) {
            tools.push({ googleSearch: {} });
        }

        // START CHAT SESSION
        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
            tools: tools,
        });

        let finalPrompt = message;

        // 1. Add Code Context (Sandbox)
        if (context) {
            finalPrompt = `CONTEXT (User's Code Editor):\n\`\`\`${context}\`\`\`\n\nUSER QUESTION: ${message}`;
        }

        // TOOL: Wallet Saving Instruction
        // Replaced old 'SAVE_WALLET' purely with 'wallet_suggestion' auto-trigger logic.
        // We now look for the `[SYSTEM REMINDER]` content in the message to forcefully trigger this behavior if needed.

        finalPrompt = `SYSTEM INSTRUCTION: Your goal is to help the user build their "Knowledge Wallet".
        If the user discusses a Core Coding Concept or specifically asks for an Error Fix:
        You MUST append a JSON suggestion block at the VERY END of your response.
        
        Format:
        :::wallet_suggestion { "type": "concept", "title": "Concept Name", "summary": "Short summary", "tags": ["tag1"] } :::
        OR
        :::wallet_suggestion { "type": "error", "title": "Error Name", "summary": "Fix explanation", "tags": ["tag1"], "severity": "medium" } :::
        
        Only suggest one item.
        
        ${finalPrompt}`;

        // 2. Add RAG Context (Notebook Sources)
        const sourceIds = (sources as NoteSource[])?.map(s => s.id) || [];

        if (sourceIds.length > 0) {
            console.log("Retrieving RAG context for sources:", sourceIds);
            const ragText = await retrieveRelevantContext(message, sourceIds);
            if (ragText) {
                finalPrompt = `CONTEXT (Retrieved from User's Notes):\n${ragText}\n\n${finalPrompt}`;
            }
        }

        // 3. Add Error Wallet Context (Proactive Mentoring)
        const activeErrors = await fetchActiveErrors();
        if (activeErrors) {
            finalPrompt = `SYSTEM NOTE: The user has a history of these errors: [${activeErrors}]. If their code shows signs of this, warn them gently.\n\n${finalPrompt}`;
        }

        // SEND MESSAGE
        const result = await chat.sendMessageStream(finalPrompt);

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
