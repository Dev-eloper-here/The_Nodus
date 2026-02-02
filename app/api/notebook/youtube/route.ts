import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { embedText } from "@/lib/gemini";

// Helper to extract Video ID
function extractVideoID(url: string) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

export async function POST(req: NextRequest) {
    try {
        const { url, userId, manualText } = await req.json();

        if (!url || !userId) {
            return NextResponse.json({ error: "Missing url or userId" }, { status: 400 });
        }

        const videoId = extractVideoID(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        console.log(`Processing YouTube Video: ${videoId} for user ${userId}`);

        // 1. Fetch Metadata (Title/Thumbnail) via oEmbed (No API Key needed)
        // Note: oEmbed usually works better than raw scraping
        let videoTitle = `YouTube: ${videoId}`;
        try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                videoTitle = oembedData.title || videoTitle;
            }
        } catch (e) {
            console.warn("Failed to fetch oEmbed data", e);
        }

        let transcriptItems;

        // 2. Use Manual Text or Fetch Transcript
        if (manualText) {
            console.log("Using manual transcript text provided by user");
            transcriptItems = [{ text: manualText, duration: 0, offset: 0 }];
        } else {
            try {
                // Try fetching with default config first
                try {
                    transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
                } catch (firstErr) {
                    // Try with specific language (sometimes needed for non-US servers)
                    try {
                        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
                    } catch (secondErr) {
                        // One last try with auto-generated
                        console.warn("Retrying transcript with auto-generated flag...");
                        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en-US' });
                    }
                }
            } catch (e: any) {
                console.warn("YouTube Transcript completely failed", e.message);

                // FALLBACK: Try to fetch Description using spoofed headers
                try {
                    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                            "Accept-Language": "en-US,en;q=0.5"
                        }
                    });
                    const html = await pageRes.text();

                    // Simple Regex for description
                    const match = html.match(/"shortDescription":"(.*?)"/);
                    let description = match ? match[1] : "";

                    if (!description) {
                        // Try meta tag
                        const metaMatch = html.match(/<meta name="description" content="([^"]*)"/);
                        description = metaMatch ? metaMatch[1] : "";
                    }

                    if (description) {
                        // Unescape JSON/HTML
                        const cleanDesc = description.replace(/\\"/g, '"').replace(/\\n/g, '\n');
                        const fallbackText = `[AUTO-GENERATED: Captions Unavailable. using Video Description]\n\nDESCRIPTION:\n${cleanDesc}`;
                        transcriptItems = [{ text: fallbackText, duration: 0, offset: 0 }];
                    }
                } catch (descErr) {
                    console.error("Description fallback failed:", descErr);
                }
            }
        }

        // SOFT FAIL: If still no transcript, Create a placeholder source so user can edit later
        if (!transcriptItems || transcriptItems.length === 0) {
            console.warn("No text found. Creating placeholder source.");
            transcriptItems = [{ text: "[No transcript found. Please use the 'Edit Note' button to paste a summary manually.]", duration: 0, offset: 0 }];
        }

        // 3. Combine Transcript into Chunks
        // YoutubeTranscript returns many small lines. We need to group them.
        // Similar logic to our PDF chunking, aiming for ~500-1000 characters per chunk
        const fullText = transcriptItems.map((item: { text: string }) => item.text).join(" ");

        // Simple chunking by logical breaks or length
        const chunks: string[] = [];
        let currentChunk = "";

        // Use the items directly to respect time-flow, but group them
        for (const item of transcriptItems) {
            const text = item.text + " ";
            if (currentChunk.length + text.length > 800) { // ~800 chars limit
                chunks.push(currentChunk.trim());
                currentChunk = text;
            } else {
                currentChunk += text;
            }
        }
        if (currentChunk.trim()) chunks.push(currentChunk.trim());

        // 4. Embed Chunks (Gemini)
        console.log(`Embedding ${chunks.length} chunks...`);
        const embeddings = await Promise.all(chunks.map(chunk => embedText(chunk)));

        // 5. Create Response Object
        // In a real app, we'd fetch the video title via oEmbed or similar
        // For now, we'll use a generic title or the URL
        const title = `YouTube: ${videoId}`;

        const source = {
            id: `yt-${videoId}-${Date.now()}`,
            title: videoTitle,
            fileName: `https://youtu.be/${videoId}`,
            type: 'youtube',
            createdAt: Date.now(),
            chunkCount: chunks.length,
            // 5. Save to Firestore (For Persistence)
            const { db } = await import("@/lib/firebase");
            const { doc, setDoc, collection, writeBatch } = await import("firebase/firestore");

            // Save Source Metadata
            const sourceRef = doc(collection(db, "sources"), source.id);
            await setDoc(sourceRef, { ...source, userId });

            // Save Chunks (Batch Write)
            const batch = writeBatch(db);
            const chunksRef = collection(db, "sources", source.id, "chunks");

            chunks.forEach((text, i) => {
                const chunkRef = doc(chunksRef, `${source.id}-chunk-${i}`);
                batch.set(chunkRef, {
                    id: `${source.id}-chunk-${i}`,
                    sourceId: source.id,
                    text,
                    embedding: embeddings[i],
                    index: i
                });
            });

            await batch.commit();
            console.log("Saved YouTube source to DB");

            // Adding a custom 'data' field to NoteSource for local RAG would be ideal
            // But NoteSource definition in types.ts doesn't have 'chunks'.
            // Let's check how PDF upload handles it.
            // ... NotebookUploader calls /api/notebook/upload ...
            // Let's verify what that returns.
        };

        // We need to return the chunks so the Chat API can use them.
        // Current 'NoteSource' type only has metadata.
        // Let's assume there's a 'content' or 'chunks' field we are missing in types or handled separately.
        // Re-reading types.ts...
        // `NoteSource` only has metadata. `NoteChunk` is separate.
        // But `app/notebook/page.tsx` fetches logic:
        // `fetch(api/notebook?userId=...)` -> returns sources.
        // How does /api/chat get the text?
        // `body: JSON.stringify({ sources: sources })`
        // If sources only have metadata, RAG is impossible unless backend fetches content again.
        // Checking /api/chat logic (assumed) or /api/notebook logic.

        // Actually, for this "Serverless/Local" hybrid pattern in the hackathon:
        // We should just return the whole object with chunks attached, even if valid type doesn't explicit it yet.
        // Or update the type.

        const responseData = {
            source,
            chunks: chunks.map((text, i) => ({
                id: `${source.id}-chunk-${i}`,
                sourceId: source.id,
                text,
                embedding: embeddings[i],
                index: i
            }))
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("YouTube Processing Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
