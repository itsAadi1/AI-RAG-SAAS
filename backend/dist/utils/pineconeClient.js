"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pineconeIndex = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
const pinecone = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
exports.pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
//# sourceMappingURL=pineconeClient.js.map