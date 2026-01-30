
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, where, doc, deleteDoc, updateDoc } from "firebase/firestore";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        let q;
        if (userId) {
            q = query(collection(db, "wallet"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        } else {
            // Fallback: Return all if no user specified (or handle as 400? For now, allow fallback like before)
            q = query(collection(db, "wallet"), orderBy("createdAt", "desc"));
        }

        const snapshot = await getDocs(q);

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ items });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.title || !body.type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newItem = {
            ...body,
            createdAt: Date.now(),
            date: new Date().toLocaleDateString() // Simple date string for display
        };

        const docRef = await addDoc(collection(db, "wallet"), newItem);

        return NextResponse.json({ success: true, item: { id: docRef.id, ...newItem } });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await deleteDoc(doc(db, "wallet", id));
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const docRef = doc(db, "wallet", id);
        await updateDoc(docRef, updates);

        return NextResponse.json({ success: true, id, updates });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
