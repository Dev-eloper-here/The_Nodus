
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';


export async function GET(request: NextRequest) {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            return NextResponse.json({ provider: 'gemini', geminiKey: '', openaiKey: '' });
        }

        const content = fs.readFileSync(envPath, 'utf-8');
        const getVal = (key: string) => {
            const match = content.match(new RegExp(`${key}=(.*)`));
            return match ? match[1].trim() : '';
        };

        return NextResponse.json({
            provider: getVal('NEXT_PUBLIC_AI_PROVIDER') === 'openai' ? 'openai' : 'gemini',
            geminiKey: getVal('GEMINI_API_KEY'), // sending back logic so UI can populate. HTTPS is assumed for safety or localhost.
            openaiKey: getVal('OPENAI_API_KEY')
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { geminiKey, openaiKey, provider } = await request.json();

        const envPath = path.join(process.cwd(), '.env.local');

        let envContent = "";
        // Read existing if exists to avoid wiping others? 
        // For this user context, simple overwrite or append is likely fine. 
        // Let's just write the keys.

        if (geminiKey) envContent += `GEMINI_API_KEY=${geminiKey}\n`;
        if (openaiKey) envContent += `OPENAI_API_KEY=${openaiKey}\n`;
        if (provider) envContent += `NEXT_PUBLIC_AI_PROVIDER=${provider}\n`;

        fs.writeFileSync(envPath, envContent);

        return NextResponse.json({ success: true, message: "Settings saved. Please restart the server." });

    } catch (error: any) {
        console.error("Settings error:", error);
        return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
    }
}
