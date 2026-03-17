"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
function estimateTokens(text) {
    // 4 chars per token
    return Math.ceil(text.length / 4);
}
function chunkText(text, maxTokens = 500) {
    // Normalize text
    const cleaned = text
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "\n\n")
        .trim();
    // Split by paragraphs (semantic boundary)
    const paragraphs = cleaned
        .split("\n\n")
        .map(p => p.trim())
        .filter(Boolean);
    const chunks = [];
    let currentChunk = "";
    let currentTokens = 0;
    for (const paragraph of paragraphs) {
        const paragraphTokens = estimateTokens(paragraph);
        // Paragraph itself too large → force split
        if (paragraphTokens > maxTokens) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
                currentTokens = 0;
            }
            chunks.push(paragraph);
            continue;
        }
        if (currentTokens + paragraphTokens <= maxTokens) {
            currentChunk += paragraph + "\n\n";
            currentTokens += paragraphTokens;
        }
        else {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph + "\n\n";
            currentTokens = paragraphTokens;
        }
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}
//# sourceMappingURL=chunkText.js.map