import { embedText } from "../utils/embedding";
import { pineconeIndex } from "../utils/pineconeClient";
import prisma from "../prisma/prisma";
import { chunkText } from "../utils/chunkText";
import { embedSingleText } from "../utils/embedding";
import Groq from "groq-sdk";
export async function processDocumentForRAG(documentId: string, text: string) {
  // Get document to retrieve workspaceId
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { workspaceId: true },
  });

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  // 1. Split into chunks
  const chunks = chunkText(text);

  // 2. Generate FREE embeddings using HuggingFace
  const embeddings = await embedText(chunks);
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
      embedding = embedding.flat() as number[];
    }
    
    // Convert to proper number array
    const vector = embedding.map(n => Number(n));

    // Save chunk + embedding to Postgres
    const savedChunk = await prisma.chunk.create({
      data: {
        documentId,
        text: chunk,
        vector: vector,
        position: i,
      },
    });

    // Store embedding in Pinecone with workspaceId in metadata
    await pineconeIndex.upsert([
      {
        id: savedChunk.id,
        values: vector,
        metadata: {
          text: chunk,
          documentId,
          workspaceId: document.workspaceId,
        },
      },
    ]);
  }

  return { message: "Document processed into RAG chunks successfully" };
}



const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function answerWithRAG(question: string, workspaceId: string) {
  // 1. Embed the question (4096 dims)
  const queryEmbedding = await embedSingleText(question);
  console.log("Question embedding size:", queryEmbedding.length); // Should be 384

  // 2. Vector search in Pinecone - retrieve more chunks to ensure diversity across documents
  const results = await pineconeIndex.query({
    topK: 50, // Increased to account for workspace filtering
    vector: queryEmbedding,
    includeMetadata: true
  });

  // 3. Filter by workspaceId first
  const workspaceMatches = results.matches.filter(
    match => match.metadata?.workspaceId === workspaceId
  );

  if (workspaceMatches.length === 0) {
    return {
      answer: "I don't have any documents in this workspace to answer your question. Please upload some documents first.",
      sources: []
    };
  }

  // 4. Ensure diversity across documents - limit chunks per document
  const documentChunkMap = new Map<string, Array<typeof results.matches[0]>>();
  const maxChunksPerDocument = 5; // Maximum chunks per document to ensure diversity

  for (const match of workspaceMatches) {
    const documentId = match.metadata?.documentId as string;
    if (documentId) {
      if (!documentChunkMap.has(documentId)) {
        documentChunkMap.set(documentId, []);
      }
      const chunks = documentChunkMap.get(documentId)!;
      if (chunks.length < maxChunksPerDocument) {
        chunks.push(match);
      }
    }
  }

  // Flatten and take top chunks from diverse documents
  const diverseMatches: Array<typeof results.matches[0]> = [];
  for (const chunks of documentChunkMap.values()) {
    diverseMatches.push(...chunks);
  }

  // Sort by score to maintain relevance
  diverseMatches.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Take top 10-15 chunks from diverse documents
  const selectedMatches = diverseMatches.slice(0, 15);

  const context = selectedMatches
    .map(m => m.metadata?.text)
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
    model: "llama-3.3-70b-versatile",   // Recommended model
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
