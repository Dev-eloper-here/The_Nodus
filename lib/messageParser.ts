export interface WalletSuggestionData {
    type: 'concept' | 'error';
    title: string;
    summary: string;
    tags?: string[];
    severity?: 'low' | 'medium' | 'high';
}

export function parseWalletSuggestion(content: string): { text: string; suggestion: WalletSuggestionData | null } {
    const suggestionRegex = /:::wallet_suggestion\s*({[\s\S]*?})\s*:::/;
    const match = content.match(suggestionRegex);

    if (match) {
        try {
            const suggestionData = JSON.parse(match[1]);
            // Remove the block from the visible text
            const cleanText = content.replace(match[0], "").trim();
            return {
                text: cleanText,
                suggestion: suggestionData
            };
        } catch (e) {
            console.error("Failed to parse wallet suggestion JSON", e);
        }
    }

    return { text: content, suggestion: null };
}
