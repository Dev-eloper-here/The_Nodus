
export interface NoteSource {
    id: string;
    title: string;
    fileName: string;
    type: 'pdf' | 'text';
    createdAt: number; // Timestamp
    chunkCount: number;
}

export interface NoteChunk {
    id: string;
    sourceId: string;
    text: string;
    embedding: number[];
    index: number;
}
