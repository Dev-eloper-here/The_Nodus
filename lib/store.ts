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
    currentThreadId: string | null;
    setCurrentThreadId: (id: string | null) => void;

    // Editor Integration (Logic Sync)
    editorCode: string;
    setEditorCode: (code: string) => void;
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
            clearMessages: () => set({ messages: [], currentThreadId: null }),

            currentThreadId: null,
            setCurrentThreadId: (id) => set({ currentThreadId: id }),

            editorCode: "// Write your code here...",
            setEditorCode: (code) => set({ editorCode: code }),
        }),
        {
            name: 'nodus-chat-storage', // unique name for localStorage
        }
    )
);
