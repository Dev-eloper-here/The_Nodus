import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

interface UserStats {
    userId: string;
    currentStreak: number;
    lastActivityDate: string; // YYYY-MM-DD
    totalActivities: number;
    activityMap: {
        [date: string]: number; // "2024-02-01": 5
    }
}

/**
 * Logs a user activity (message, upload, save) and updates streak/graph.
 * Call this from API routes (server-side).
 */
export async function logActivity(userId: string) {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const statsRef = doc(db, "user_gamification", userId);

    try {
        const docSnap = await getDoc(statsRef);

        if (!docSnap.exists()) {
            // First time user
            const newStats: UserStats = {
                userId,
                currentStreak: 1,
                lastActivityDate: today,
                totalActivities: 1,
                activityMap: { [today]: 1 }
            };
            await setDoc(statsRef, newStats);
            return;
        }

        const data = docSnap.data() as UserStats;
        const lastDate = data.lastActivityDate;

        // Calculate Streak
        let newStreak = data.currentStreak;

        if (lastDate === today) {
            // Already active today, just increment count not streak
        } else {
            // Check if yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
                // Continued streak
                newStreak += 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        }

        // Update DB
        // We use dot notation for nested map updates to avoid overwriting
        await updateDoc(statsRef, {
            currentStreak: newStreak,
            lastActivityDate: today,
            totalActivities: increment(1),
            [`activityMap.${today}`]: increment(1)
        });

    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't block the main action if gamification fails
    }
}

/**
 * Fetch stats for the frontend dashboard
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
    try {
        const statsRef = doc(db, "user_gamification", userId);
        const docSnap = await getDoc(statsRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserStats;
        }
        return null;
    } catch (error) {
        console.error("Failed to get stats:", error);
        return null;
    }
}
