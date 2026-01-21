
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// GET: Fetch recent errors for the wallet UI
export async function GET(req: NextRequest) {
    try {
        const q = query(collection(db, "errors"), orderBy("createdAt", "desc"), limit(20));
        const snapshot = await getDocs(q);
        const errors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ success: true, errors });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Log a new error (called by AI or User)
export async function POST(req: NextRequest) {
    try {
        const { title, description, category, severity } = await req.json();

        const docRef = await addDoc(collection(db, "errors"), {
            title,
            description,
            category: category || "Syntax", // e.g., Runtime, Logic
            severity: severity || "low",
            resolved: false,
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
