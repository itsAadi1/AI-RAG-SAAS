"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
exports.embedSingleText = embedSingleText;
const inference_1 = require("@huggingface/inference");
const client = new inference_1.InferenceClient(process.env.HF_TOKEN);
function normalizeEmbedding(embedding) {
    var flatEmbedding;
    if (Array.isArray(embedding[0])) {
        flatEmbedding = embedding.flat();
    }
    else {
        flatEmbedding = embedding;
    }
    return flatEmbedding.map(Number);
}
// Multiple texts (PARALLEL + BATCHED)
async function embedText(texts) {
    const vectors = [];
    var batchSize = 10;
    for (var i = 0; i < texts.length; i += batchSize) {
        var batch = texts.slice(i, i + batchSize);
        const embeddings = await client.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: batch,
            provider: "hf-inference"
        });
        for (const emb of embeddings) {
            vectors.push(emb.map(Number));
        }
    }
    return vectors;
}
// Single text (unchanged, already fine)
async function embedSingleText(text) {
    const embedding = await client.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
        provider: "hf-inference"
    });
    return normalizeEmbedding(embedding);
}
//# sourceMappingURL=embedding.js.map