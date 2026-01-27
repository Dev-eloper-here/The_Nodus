
import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/ai";

// Ensure Node.js runtime for stability
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { topic } = await request.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const prompt = `Generate a quiz about "${topic}". 
        Create 5 distinct multiple-choice questions. 
        Format:
        [
            {
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0 // Index of correct option (0-3),
                "explanation": "Brief explanation of why this is correct"
            }
        ]`;

        // Use standard Gemini logic with JSON enforcement
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let questions;
        try {
            questions = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON", responseText);
            // Fallback cleanup
            const clean = responseText.replace(/```json\n?|\n?```/g, "").trim();
            try {
                questions = JSON.parse(clean);
            } catch (e2) {
                throw new Error("AI returned invalid JSON format.");
            }
        }

        return NextResponse.json({ questions });

    } catch (error: any) {
        console.error("Quiz generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
    }
}
