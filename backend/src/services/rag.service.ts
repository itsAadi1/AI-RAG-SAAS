
import { embedSingleText } from "../utils/embedding";
import Groq from "groq-sdk";
import { embedText } from "../utils/embedding";
import { pineconeIndex } from "../utils/pineconeClient";
import prisma from "../prisma/prisma";
import { chunkText } from "../utils/chunkText";

  import { GoogleGenAI } from "@google/genai";
export async function processDocumentForRAG(documentId: string, text: string) {
  try {
    // Mark document as PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" }
    });

    // Fetch workspaceId (needed for Pinecone metadata)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true }
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Chunk text
    const chunks = chunkText(text);

    if (!chunks.length) {
      throw new Error("No text chunks generated");
    }

    // Generate embeddings (already batched internally)
    const embeddings = await embedText(chunks);

    if (embeddings.length !== chunks.length) {
      throw new Error("Embedding count mismatch");
    }

    // Prepare chunk records for DB
    const chunkRecords = chunks.map((chunk, index) => ({
      documentId: documentId,
      text: chunk,
      vector: embeddings[index],
      position: index
    }));

    // Insert all chunks at once
    await prisma.chunk.createMany({
      data: chunkRecords
    });

    // Fetch saved chunks (to get IDs for Pinecone)
    const savedChunks = await prisma.chunk.findMany({
      where: { documentId: documentId },
      select: {
        id: true,
        text: true,
        vector: true
      }
    });

    if (!savedChunks.length) {
      throw new Error("Chunks not persisted");
    }

    // Prepare Pinecone vectors
    const pineconeVectors = savedChunks.map(chunk => ({
      id: chunk.id,
      values: chunk.vector,
      metadata: {
        text: chunk.text,
        documentId: documentId,
        workspaceId: document.workspaceId
      }
    }));

    // Single batch upsert to Pinecone
    await pineconeIndex.upsert(pineconeVectors);

    // Mark document as READY
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" }
    });

    return {
      success: true,
      chunksIndexed: savedChunks.length
    };

  } catch (error: any) {
    console.error("RAG processing failed:", error);

    // Mark document as FAILED
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" }
    });

    throw error;
  }
}


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function answerWithRAG(question: string, workspaceId: string) {
  // 1. Embed the question (4096 dims)
  const queryEmbedding = await embedSingleText(question);
  // const rewrittenQuery = await rewriteQuery(question);
// console.log("Rewritten query:", rewrittenQuery);

// const queryEmbedding = await embedSingleText(rewrittenQuery);

  console.log("Question embedding size:", queryEmbedding.length); // Should be 384

  // 2. Vector search in Pinecone - retrieve more chunks to ensure diversity across documents
  const results = await pineconeIndex.query({
    topK: 50, // Increased to account for workspace filtering
    vector: queryEmbedding,
    includeMetadata: true,
  });

  // 3. Filter by workspaceId first
  const workspaceMatches = results.matches.filter(
    (match) => match.metadata?.workspaceId === workspaceId
  );

  if (workspaceMatches.length === 0) {
    return {
      answer:
        "I don't have any documents in this workspace to answer your question. Please upload some documents first.",
      sources: [],
    };
  }

  // 4. Ensure diversity across documents - limit chunks per document
  const documentChunkMap = new Map<
    string,
    Array<(typeof results.matches)[0]>
  >();
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
  const diverseMatches: Array<(typeof results.matches)[0]> = [];
  for (const chunks of documentChunkMap.values()) {
    diverseMatches.push(...chunks);
  }

  // Sort by score to maintain relevance
  diverseMatches.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Take top 10-15 chunks from diverse documents
  const selectedMatches = diverseMatches.slice(0, 15);
  // Take initial candidates
// const initialCandidates = diverseMatches.slice(0, 15);

// Re-rank using LLM
// const selectedMatches = await rerankChunks(
//   question,
//   initialCandidates,
//   7 // final context size
// );


  const context = selectedMatches.map((m) => m.metadata?.text).join("\n\n");

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
  // const completion = await groq.chat.completions.create({
  //   model: "llama-3.3-70b-versatile", // Recommended model
  //   temperature: 1,
  //   messages: [
  //     { role: "system", content: "You are a helpful AI assistant." },
  //     { role: "user", content: prompt },
  //   ],
  // });

const ai = new GoogleGenAI({});
  
  const completion = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      `${prompt}`
    ],
    config: {
      systemInstruction: "You are a helpful AI assistant.",

    }
  });
  

  
  const answer =completion.text;

  return {
    answer,
    sources: selectedMatches,
  };
}
