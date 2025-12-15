export declare function processDocumentForRAG(documentId: string, text: string): Promise<{
    message: string;
}>;
export declare function answerWithRAG(question: string): Promise<{
    answer: string | null;
    sources: import("@pinecone-database/pinecone").ScoredPineconeRecord<import("@pinecone-database/pinecone").RecordMetadata>[];
}>;
//# sourceMappingURL=rag.service.d.ts.map