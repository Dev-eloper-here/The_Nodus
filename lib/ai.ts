
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type AIProvider = 'gemini' | 'openai';

export const AI_PROVIDER = (process.env.NEXT_PUBLIC_AI_PROVIDER as AIProvider) || 'gemini';

// Gemini Config (AI Studio)
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(GEMINI_KEY);
export const GEMINI_MODEL = "gemini-pro";

// OpenAI Config
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
export const openai = new OpenAI({
    apiKey: OPENAI_KEY,
    dangerouslyAllowBrowser: true // Only if used client-side, but we are using server-side mostly
});
export const OPENAI_MODEL = "gpt-4o"; // or gpt-3.5-turbo

export function getActiveProvider(): AIProvider {
    return AI_PROVIDER;
}
