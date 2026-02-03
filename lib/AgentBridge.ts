/**
 * AgentBridge.ts
 * Service to communicate with remote OpenClaw Agent VM.
 * Maps Firebase UID to Session ID for personalized context.
 */

const CLAWBOT_GATEWAY = process.env.NEXT_PUBLIC_CLAWBOT_GATEWAY || "http://136.113.181.241:18789";
const CLAWBOT_TOKEN = process.env.NEXT_PUBLIC_CLAWBOT_TOKEN;

export type AgentTriggerType = "error" | "streak_break" | "milestone" | "activity";

interface AgentPayload {
    session_id: string; // Firebase UID
    trigger: AgentTriggerType;
    data: any;
    timestamp: number;
}

/**
 * Sends a trigger to the OpenClaw Agent.
 * @param userId - The Firebase UID of the student (mapped to session_id).
 * @param triggerType - The type of event (error, streak break, etc).
 * @param data - Contextual data (error message, streak count, etc).
 */
export async function sendAgentAlert(userId: string, triggerType: AgentTriggerType, data: any) {
    // 1. Check Feature Flag (Client-side only)
    if (typeof window !== "undefined") {
        const isEnabled = localStorage.getItem("enableAI") === "true";
        if (!isEnabled) {
            // console.log("Agent skipped: AI Tutor disabled.");
            return;
        }
    }

    if (!userId) return;

    const payload: AgentPayload = {
        session_id: userId,
        trigger: triggerType,
        data: data,
        timestamp: Date.now()
    };

    try {
        console.log(`[AgentBridge] Sending ${triggerType} alert to ${CLAWBOT_GATEWAY}`);

        // We use 'no-cors' mode if the VM doesn't support CORS yet, 
        // but ideally it should be a standard POST.
        // For Hackathon, we'll try standard first.
        const response = await fetch(`${CLAWBOT_GATEWAY}/api/agent/notify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CLAWBOT_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.warn(`[AgentBridge] Server returned ${response.status}`);
        } else {
            console.log("[AgentBridge] Alert sent successfully.");
        }

    } catch (error) {
        // Fail silently so we don't disrupt the user app
        console.warn("[AgentBridge] Connection failed (VM might be down):", error);
    }
}
