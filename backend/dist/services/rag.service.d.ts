export declare function processDocumentForRAG(documentId: string, text: string): Promise<{
    success: boolean;
    chunksIndexed: number;
}>;
export declare function answerWithRAG(question: string, workspaceId: string): Promise<{
    answer: string | undefined;
    sources: import("@pinecone-database/pinecone").ScoredPineconeRecord<import("@pinecone-database/pinecone").RecordMetadata>[];
}>;
//# sourceMappingURL=rag.service.d.ts.map