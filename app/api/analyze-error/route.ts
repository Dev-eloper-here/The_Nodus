import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const { code, errorLog, language } = await req.json();

        if (!code || !errorLog) {
            return NextResponse.json({ error: "Missing code or error log" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `
        You are a helpful coding tutor for students.
        Analyze the following execution error and source code.
        
        LANGUAGE: ${language}
        CODE:
        ${code}

        ERROR LOG:
        ${errorLog}

        Your goal is to explain this error to a student in a simple, friendly way.
        Return ONLY a JSON object with the following structure (no markdown formatting):
        {
            "title": "Short, descriptive title of the error (max 5-6 words)",
            "summary": "A clear, 2-3 sentence explanation of what went wrong and how to fix it. Do not include the raw error log here."
        }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean up markdown code blocks if Gemini adds them
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const analysis = JSON.parse(text);

        return NextResponse.json(analysis);

    } catch (e: any) {
        console.error("Error analysis failed:", e);
        // Fallback if AI fails: Return safe defaults
        return NextResponse.json({
            title: "Runtime Error",
            summary: "An error occurred during execution. Please check the raw logs."
        });
    }
}
