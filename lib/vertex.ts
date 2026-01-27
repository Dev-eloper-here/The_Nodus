
import { VertexAI } from '@google-cloud/vertexai';

// Vertex AI Configuration
const PROJECT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT || "project-59e7884b-0454-419f-ad3";
const LOCATION = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_LOCATION || "us-central1";

// Initialize Vertex AI
const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
});

// Models
export const GEMINI_MODEL_ID = "gemini-1.5-pro-001"; // Or latest preview
export const EMBEDDING_MODEL_ID = "text-embedding-004";

// Export the initialized instance and helper to get models
export const getModel = () => {
    return vertexAI.getGenerativeModel({ model: GEMINI_MODEL_ID });
};

export const getEmbeddingModel = () => {
    return vertexAI.getGenerativeModel({ model: EMBEDDING_MODEL_ID });
};

// Helper for Embeddings
export async function embedText(text: string): Promise<number[]> {
    try {
        const model = getEmbeddingModel();
        const result = await model.embedContent(text);
        const embedding = result.embeddings[0].values;
        return embedding;
    } catch (error) {
        console.error("Vertex AI Embedding Error:", error);
        throw error;
    }
}
