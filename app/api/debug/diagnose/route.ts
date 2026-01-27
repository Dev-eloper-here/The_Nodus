
import { NextRequest, NextResponse } from "next/server";
import { genAI as aiGenAI, GEMINI_MODEL } from "@/lib/ai";
import { embedText } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const report: any = {
        quiz: { status: "pending" },
        rag: { status: "pending" },
        wallet: { status: "pending" }
    };

    // 1. TEST GEMINI (Quiz Logic)
    try {
        const model = aiGenAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent("Say 'Test OK'");
        report.quiz = {
            status: "success",
            modelUsed: GEMINI_MODEL,
            response: result.response.text()
        };
    } catch (e: any) {
        report.quiz = { status: "failed", error: e.message };
    }

    // 2. TEST EMBEDDING (RAG Logic)
    try {
        // Test standard embedding
        const vec = await embedText("Hello world");
        report.rag = {
            status: "success",
            vectorLength: vec.length
        };
    } catch (e: any) {
        report.rag = { status: "failed", error: e.message };
    }

    // 3. TEST FIREBASE (Wallet Logic)
    try {
        const q = query(collection(db, "wallet"), limit(1));
        const snapshot = await getDocs(q);
        report.wallet = {
            status: "success",
            docCount: snapshot.size
        };
    } catch (e: any) {
        report.wallet = { status: "failed", error: e.message };
    }

    return NextResponse.json(report, { status: 200 });
}
