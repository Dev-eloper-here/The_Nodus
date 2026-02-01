import { db } from "./firebase";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    limit
} from "firebase/firestore";

// Types
export interface Thread {
    id: string;
    userId: string;
    title: string;
    createdAt: any;
    updatedAt: any;
    model?: string; // e.g., 'gemini-1.5-flash'
}

export interface dbMessage {
    id?: string;
    role: 'user' | 'ai';
    content: string;
    createdAt: any;
}

// Collections
const THREADS_COLLECTION = 'threads';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Creates a new chat thread
 */
export async function createThread(userId: string, title: string = "New Chat", model: string = "gemini-1.5-flash"): Promise<string> {
    const threadData = {
        userId,
        title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        model
    };

    const docRef = await addDoc(collection(db, THREADS_COLLECTION), threadData);
    return docRef.id;
}

/**
 * Adds a message to a thread
 */
export async function addMessageToThread(threadId: string, role: 'user' | 'ai', content: string) {
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    await addDoc(messagesRef, {
        role,
        content,
        createdAt: serverTimestamp()
    });

    // Update thread's "updatedAt" and snippet
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
        updatedAt: serverTimestamp()
    });
}

/**
 * Fetches all threads for a user, ordered by recent
 */
export async function getUserThreads(userId: string): Promise<Thread[]> {
    const q = query(
        collection(db, THREADS_COLLECTION),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Thread));
}

/**
 * Fetches messages for a specific thread
 */
export async function getThreadMessages(threadId: string): Promise<dbMessage[]> {
    const q = query(
        collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION),
        orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as dbMessage));
}

/**
 * Updates thread title (e.g. after AI generates a better one)
 */
export async function updateThreadTitle(threadId: string, newTitle: string) {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, { title: newTitle });
}
