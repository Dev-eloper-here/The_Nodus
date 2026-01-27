
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            return NextResponse.json({ geminiKey: '' });
        }

        const content = fs.readFileSync(envPath, 'utf-8');
        const getVal = (key: string) => {
            const match = content.match(new RegExp(`${key}=(.*)`));
            return match ? match[1].trim() : '';
        };

        return NextResponse.json({
            geminiKey: getVal('GEMINI_API_KEY')
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { geminiKey } = await request.json();

        const envPath = path.join(process.cwd(), '.env.local');

        // Simple write - solely focusing on essential config
        // In real app, we should parse existing, but here we overwrite for simplicity/stability as requested.
        let envContent = "";
        if (geminiKey) envContent += `GEMINI_API_KEY=${geminiKey}\n`;
        envContent += `NEXT_PUBLIC_AI_PROVIDER=gemini\n`; // Force provider

        fs.writeFileSync(envPath, envContent);

        return NextResponse.json({ success: true, message: "Settings saved. Please restart the server." });

    } catch (error: any) {
        console.error("Settings error:", error);
        return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
    }
}
