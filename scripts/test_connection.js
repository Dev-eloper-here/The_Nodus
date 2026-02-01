const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// 1. Load API Key explicitly from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = process.env.GEMINI_API_KEY;

if (fs.existsSync(envPath)) {
    console.log(`Reading .env.local from: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
        // Remove quotes if present
        if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
            apiKey = apiKey.slice(1, -1);
        }
    }
}

if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY not found.");
    process.exit(1);
}

console.log(`🔑 Using API Key: ${apiKey.substring(0, 5)}...******`);

// 2. Initialize SDK
const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
    try {
        console.log("\n📡 1. Testing Model List...");
        // Some older keys/accounts might not support listModels via this SDK, but let's try.
        // If this fails, we skip to direct generation.
        try {
            // Note: listModels is invalid on the main class in some versions, you usually get it from the model? 
            // Actually, newer SDK has no global listModels easily exposed in common usage, 
            // but we can try to just get a model and run it.
            // Wait, we CAN use the API directly or assume standard models.
            // Let's just try generating with multiple candidates.
            console.log("   (Skipping listModels API call as it varies by SDK version/auth scope)");
        } catch (e) {
            console.log("   List check failed (ignoring).");
        }

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        console.log("\n🧪 2. Testing Generation Candidates:");

        for (const modelId of candidates) {
            process.stdout.write(`   Testing '${modelId}'... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelId });
                const result = await model.generateContent("Hi");
                const response = await result.response;
                console.log(`✅ SUCCESS! Output: "${response.text().substring(0, 20)}..."`);

                console.log(`\n🎉 RECOMMENDATION: Use model ID "${modelId}"`);
                return; // Exit on first success
            } catch (err) {
                if (err.message.includes("404")) {
                    console.log("❌ 404 Not Found");
                } else {
                    console.log(`⚠️ ERROR: ${err.message.split('\n')[0]}`);
                }
            }
        }

        console.log("\n❌ FATAL: All models failed. Check your API Key or Google Cloud Project enablement.");

    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

testConnection();
