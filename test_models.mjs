import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q";
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    try {
        // Note: The SDK typically exposes model listing via the AI Studio API structure
        // But since that method isn't always obvious in the helper, we'll try a raw fetch if the SDK method isn't clean.
        // However, looking at SDK docs, usually you just instantiate a model.
        // Let's try to verify the model by running a simple prompt on 'gemini-pro' (older/standard) and 'gemini-1.5-flash'.

        console.log("Testing gemini-pro...");
        try {
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resPro = await modelPro.generateContent("Hi");
            console.log("gemini-pro success: " + resPro.response.text());
        } catch (e) {
            console.log("gemini-pro failed: " + e.message);
        }

        console.log("Testing gemini-1.5-flash...");
        try {
            const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const resFlash = await modelFlash.generateContent("Hi");
            console.log("gemini-1.5-flash success: " + resFlash.response.text());
        } catch (e) {
            console.log("gemini-1.5-flash failed: " + e.message);
        }

        console.log("Testing gemini-1.0-pro...");
        try {
            const model10 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const res10 = await model10.generateContent("Hi");
            console.log("gemini-1.0-pro success: " + res10.response.text());
        } catch (e) {
            console.log("gemini-1.0-pro failed: " + e.message);
        }

    } catch (error) {
        console.error("Fatal error:", error);
    }
}

main();
