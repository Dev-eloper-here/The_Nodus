import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    role: "user" | "ai";
    content: string;
}

interface ChatState {
    messages: Message[];
    addMessage: (message: Message) => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [
                {
                    role: "ai",
                    content: "Hello! I'm Sage, your coding tutor. I see you're starting a new project. How can I assist you today?"
                }
            ],
            addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
            setMessages: (update) => set((state) => ({
                messages: typeof update === 'function' ? update(state.messages) : update
            })),
            clearMessages: () => set({ messages: [] }),
        }),
        {
            name: 'nodus-chat-storage', // unique name for localStorage
        }
    )
);
