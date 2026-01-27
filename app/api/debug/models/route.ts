
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge'; // Use edge for simple fetch

export async function GET(request: NextRequest) {
    // Get Key from env
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return NextResponse.json({ error: "No API Key found in env" });
    }

    try {
        // Direct REST call to list models
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await res.json();

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
