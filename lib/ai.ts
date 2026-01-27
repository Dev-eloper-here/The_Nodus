
import { GoogleGenerativeAI } from "@google/generative-ai";

// Standardize on Gemini
export type AIProvider = 'gemini';
export const AI_PROVIDER: AIProvider = 'gemini';

// Gemini Config (AI Studio / Vertex)
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is missing in environment variables.");
}

export const genAI = new GoogleGenerativeAI(GEMINI_KEY);
export const GEMINI_MODEL = "gemini-flash-latest"; // Validated from user's list

export function getActiveProvider(): AIProvider {
    return 'gemini';
}
