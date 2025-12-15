"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
function chunkText(text, chunkSize = 300) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];
    for (const word of words) {
        currentChunk.push(word);
        const currentLength = currentChunk.join(' ').length;
        if (currentLength >= chunkSize) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}
//# sourceMappingURL=chunkText.js.map