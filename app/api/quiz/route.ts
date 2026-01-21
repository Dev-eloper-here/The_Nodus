
import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL, openai, OPENAI_MODEL, AI_PROVIDER } from "@/lib/ai";

export async function POST(request: NextRequest) {
    try {
        const { topic } = await request.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const prompt = `Generate a quiz about "${topic}". 
        Create 5 distinct multiple-choice questions. 
        Return ONLY valid JSON array with no markdown code blocks.
        Format:
        [
            {
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0 // Index of correct option (0-3),
                "explanation": "Brief explanation of why this is correct"
            }
        ]`;

        let questions;

        if (AI_PROVIDER === 'openai') {
            const completion = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a quiz generator. Output valid JSON only." },
                    { role: "user", content: prompt }
                ],
                // response_format: { type: "json_object" } // enforcing JSON if model supports
            });
            const text = completion.choices[0].message.content || "[]";
            const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
            questions = JSON.parse(cleanJson);
        } else {
            // Gemini
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
            questions = JSON.parse(cleanJson);
        }

        return NextResponse.json({ questions });

    } catch (error: any) {
        console.error("Quiz generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
    }
}
