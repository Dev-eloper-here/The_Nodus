
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// In a real app, use process.env.GEMINI_API_KEY
// For this session, we'll use the key provided in the internal files or environment
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q";

export const genAI = new GoogleGenerativeAI(API_KEY);
export const fileManager = new GoogleAIFileManager(API_KEY);

export const MODEL_NAME = "gemini-pro"; // Reliable fallback 
