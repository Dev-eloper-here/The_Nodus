
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

        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ items });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
