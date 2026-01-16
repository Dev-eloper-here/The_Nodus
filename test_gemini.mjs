import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q"; // Hardcoded for this script only to avoid env issues
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct "listModels" on the main client in some versions,
        // but typically it's accessed via the API.
        // Actually, the SDK might not expose listModels easily in the high-level helper.
        // Let's try to just use a known robust model like 'gemini-1.5-flash-latest' or 'gemini-1.0-pro'.

        // Actually, let's try to fetch a model info.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model object created. Testing generation...");

        const result = await model.generateContent("Test");
        console.log("Success! Response:", result.response.text());

    } catch (error) {
        console.error("Error in script:", error);
    }
}

listModels();
