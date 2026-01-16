import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q";
const genAI = new GoogleGenerativeAI(apiKey);
const logFile = "model_scan_results.txt";

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Test");
        const response = await result.response;
        return `SUCCESS: ${modelName} - Response: ${response.text()}`;
    } catch (error) {
        return `FAIL: ${modelName} - Error: ${error.message}`;
    }
}

async function main() {
    let output = "Starting Model Scan...\n";
    fs.writeFileSync(logFile, output);

    for (const modelName of modelsToTest) {
        const result = await testModel(modelName);
        console.log(result);
        fs.appendFileSync(logFile, result + "\n");
    }

    fs.appendFileSync(logFile, "Scan Complete.\n");
}

main();
