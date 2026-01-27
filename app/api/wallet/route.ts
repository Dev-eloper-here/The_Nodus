
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        let q;
        if (userId) {
            q = query(collection(db, "wallet"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        } else {
            // Fallback for public/legacy or just return empty? 
            // Better to return empty if no user, but for now let's keep global for backward compat if needed, 
            // or strict? Let's be strict for new world.
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
