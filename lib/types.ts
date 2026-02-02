
export interface NoteSource {
    id: string;
    title: string;
    fileName: string;
    type: 'pdf' | 'text' | 'youtube';
    createdAt: number; // Timestamp
    chunkCount: number;
    chunks?: NoteChunk[]; // Optional: For local RAG context
}

export interface NoteChunk {
    id: string;
    sourceId: string;
    text: string;
    embedding: number[];
    index: number;
}
