
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// In a real app, use process.env.GEMINI_API_KEY
// For this session, we'll use the key provided in the internal files or environment
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q";

export const genAI = new GoogleGenerativeAI(API_KEY);
export const fileManager = new GoogleAIFileManager(API_KEY);

export const MODEL_NAME = "gemini-1.5-pro"; // Powerful model for chat
export const EMBEDDING_MODEL_NAME = "text-embedding-004"; // Best for embeddings

export async function embedText(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error creating embedding:", error);
        throw error;
    }
}
