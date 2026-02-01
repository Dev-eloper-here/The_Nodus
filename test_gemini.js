const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
let apiKey = process.env.GEMINI_API_KEY;

if (fs.existsSync(envPath)) {
    console.log(`Reading .env.local...`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim().replace(/^['"]|['"]$/g, '');
    }
}

if (!apiKey) {
    console.error("❌ NO API KEY FOUND");
    process.exit(1);
}

console.log(`🔑 Key: ${apiKey.substring(0, 8)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    // Try specifically the model we configured
    const modelId = "gemini-1.5-flash-001";
    console.log(`Testing ${modelId}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent("Hello");
        console.log(`✅ RESPONSE: ${result.response.text()}`);
    } catch (e) {
        console.error(`❌ FAILED: ${e.message}`);
    }
}

run();
