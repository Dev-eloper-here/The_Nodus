const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we are running with simple node
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = process.env.GEMINI_API_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in .env.local or environment variables.");
    process.exit(1);
}

console.log("Using API Key: " + apiKey.substring(0, 5) + "...");

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Fetching available models...");

    try {
        // We can't directly list models easily with this SDK version in some cases, 
        // but we can try to instantiate a model and see if it works, or use the model listing if available.
        // Actually the SDK *does* allow listing models via the API, but let's see.
        // For now, let's try to generate content with a few common names.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
            "gemini-pro"
        ];

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log("SUCCESS ✅");
            } catch (error) {
                if (error.message.includes("404") || error.message.includes("not found")) {
                    console.log("NOT FOUND ❌");
                } else {
                    console.log(`ERROR (${error.message}) ⚠️`);
                }
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
