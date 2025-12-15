"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocumentForRAG = processDocumentForRAG;
exports.answerWithRAG = answerWithRAG;
const embedding_1 = require("../utils/embedding");
const pineconeClient_1 = require("../utils/pineconeClient");
const prisma_1 = __importDefault(require("../prisma/prisma"));
const chunkText_1 = require("../utils/chunkText");
const embedding_2 = require("../utils/embedding");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
async function processDocumentForRAG(documentId, text) {
    // 1. Split into chunks
    const chunks = (0, chunkText_1.chunkText)(text);
    // 2. Generate FREE embeddings using HuggingFace
    const embeddings = await (0, embedding_1.embedText)(chunks);
    console.log("Generated embeddings:", embeddings.length);
    // 3. Store chunks and embeddings
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let embedding = embeddings[i];
        // Ensure embedding is a flat array of numbers
        if (!Array.isArray(embedding)) {
            throw new Error(`Embedding at index ${i} is not an array`);
        }
        // Flatten if nested and ensure all elements are numbers
        if (Array.isArray(embedding[0])) {
            embedding = embedding.flat();
        }
        // Convert to proper number array
        const vector = embedding.map(n => Number(n));
        // Save chunk + embedding to Postgres
        const savedChunk = await prisma_1.default.chunk.create({
            data: {
                documentId,
                text: chunk,
                vector: vector,
                position: i,
            },
        });
        // Store embedding in Pinecone
        await pineconeClient_1.pineconeIndex.upsert([
            {
                id: savedChunk.id,
                values: vector,
                metadata: {
                    text: chunk,
                    documentId,
                },
            },
        ]);
    }
    return { message: "Document processed into RAG chunks successfully" };
}
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
async function answerWithRAG(question) {
    var _a;
    // 1. Embed the question (4096 dims)
    const queryEmbedding = await (0, embedding_2.embedSingleText)(question);
    console.log("Question embedding size:", queryEmbedding.length); // Should be 384
    // 2. Vector search in Pinecone - retrieve more chunks to ensure diversity across documents
    const results = await pineconeClient_1.pineconeIndex.query({
        topK: 20, // Increased from 5 to 20 to get chunks from multiple documents
        vector: queryEmbedding,
        includeMetadata: true
    });
    // 3. Ensure diversity across documents - limit chunks per document
    const documentChunkMap = new Map();
    const maxChunksPerDocument = 5; // Maximum chunks per document to ensure diversity
    for (const match of results.matches) {
        const documentId = (_a = match.metadata) === null || _a === void 0 ? void 0 : _a.documentId;
        if (documentId) {
            if (!documentChunkMap.has(documentId)) {
                documentChunkMap.set(documentId, []);
            }
            const chunks = documentChunkMap.get(documentId);
            if (chunks.length < maxChunksPerDocument) {
                chunks.push(match);
            }
        }
    }
    // Flatten and take top chunks from diverse documents
    const diverseMatches = [];
    for (const chunks of documentChunkMap.values()) {
        diverseMatches.push(...chunks);
    }
    // Sort by score to maintain relevance
    diverseMatches.sort((a, b) => (b.score || 0) - (a.score || 0));
    // Take top 10-15 chunks from diverse documents
    const selectedMatches = diverseMatches.slice(0, 15);
    const context = selectedMatches
        .map(m => { var _a; return (_a = m.metadata) === null || _a === void 0 ? void 0 : _a.text; })
        .join("\n\n");
    // 4. Build prompt
    const prompt = `
Use ONLY the context below to answer the user.
If the answer is not found, say: "I don't know based on the provided documents."

Context:
${context}

Question: ${question}

Answer:
`;
    // 5. Call Groq Llama3 (fast + FREE)
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Recommended model
        messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: prompt }
        ]
    });
    const answer = completion.choices[0].message.content;
    return {
        answer,
        sources: selectedMatches
    };
}
//# sourceMappingURL=rag.service.js.map