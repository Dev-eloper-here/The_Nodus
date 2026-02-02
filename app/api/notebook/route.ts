
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        let q;
        if (userId) {
            q = query(collection(db, "sources"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        } else {
            // If no user, return empty or global? Return empty for privacy.
            return NextResponse.json({ items: [] });
        }

        const snapshot = await getDocs(q);

        const items = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            // Fetch chunks for this source (Critical for RAG persistence)
            const chunksRef = collection(db, "sources", doc.id, "chunks");
            const chunksSnap = await getDocs(chunksRef);
            const chunks = chunksSnap.docs.map(c => c.data());

            return {
                id: doc.id,
                ...data,
                chunks: chunks.length > 0 ? chunks : undefined
            };
        }));

        return NextResponse.json({ items });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { sourceId } = await request.json();

        if (!sourceId) {
            return NextResponse.json({ error: "Source ID required" }, { status: 400 });
        }

        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "sources", sourceId));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
