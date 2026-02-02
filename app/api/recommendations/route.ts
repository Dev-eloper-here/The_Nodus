import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";

// Mock Database of Content
// In a real app, this would be a vector DB or a large content CMS
const LIBRARY = [
    {
        id: "vid_1",
        title: "Mastering React useEffect",
        type: "video",
        thumbnail: "https://i.ytimg.com/vi/dH6i3GurZW8/maxresdefault.jpg",
        tags: ["react", "frontend", "hooks", "useeffect"],
        reason: "Active Error: Infinite Loop in useEffect",
        url: "https://www.youtube.com/watch?v=dH6i3GurZW8"
    },
    {
        id: "vid_2",
        title: "Python Error Handling Guide",
        type: "video",
        thumbnail: "https://i.ytimg.com/vi/nlCKrKGHSSk/maxresdefault.jpg",
        tags: ["python", "error", "try-except"],
        reason: "Recent Struggle: Python IndentationError",
        url: "https://www.youtube.com/watch?v=nlCKrKGHSSk"
    },
    {
        id: "doc_1",
        title: "Understanding Async/Await",
        type: "article",
        thumbnail: "https://miro.medium.com/v2/resize:fit:1400/1*vxjAHkjgLvraKcWJLc8ksA.png",
        tags: ["javascript", "async", "promise"],
        reason: "You asked about: Promises",
        url: "https://medium.com/@username/understanding-async-await-12345"
    },
    {
        id: "vid_3",
        title: "Next.js App Router Crash Course",
        type: "video",
        thumbnail: "https://i.ytimg.com/vi/wm5gMKuwSYk/maxresdefault.jpg",
        tags: ["nextjs", "react", "fullstack"],
        reason: "Trending in your tech stack",
        url: "https://www.youtube.com/watch?v=wm5gMKuwSYk"
    }
];

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");
        if (!userId) return NextResponse.json({ items: [] });

        // 1. Fetch User's Recent Errors from Wallet
        const walletRef = collection(db, "wallet");
        const q = query(
            walletRef,
            where("userId", "==", userId),
            where("type", "==", "error")
        );
        const snapshot = await getDocs(q);
        const userErrors = snapshot.docs
            .map(d => d.data())
            // In-memory sort by date (descending)
            // Handle potentially missing createdAt by defaulting to 0
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);

        // 2. Simple Matching Logic (Mock Recommender)
        // If user has 'react' error, show react video.
        let recommendations = [];

        // Naive Check: Loop through library and see if tags match error tags/title
        const usedIds = new Set();

        // Specific Matches
        for (const error of userErrors) {
            const errorText = (error.title + " " + (error.tags || []).join(" ")).toLowerCase();

            for (const item of LIBRARY) {
                if (usedIds.has(item.id)) continue;

                // Check intersection
                const match = item.tags.some(tag => errorText.includes(tag));
                if (match) {
                    recommendations.push({
                        ...item,
                        reason: `Because you logged: "${error.title}"`
                    });
                    usedIds.add(item.id);
                }
            }
        }

        // Fill with generic if empty
        if (recommendations.length < 3) {
            for (const item of LIBRARY) {
                if (!usedIds.has(item.id)) {
                    recommendations.push({
                        ...item,
                        reason: "Recommended for you"
                    });
                    usedIds.add(item.id);
                }
                if (recommendations.length >= 4) break;
            }
        }

        return NextResponse.json({ items: recommendations });

    } catch (error: any) {
        console.error("Rec API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
