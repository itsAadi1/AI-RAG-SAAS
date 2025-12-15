"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
exports.embedSingleText = embedSingleText;
const inference_1 = require("@huggingface/inference");
const client = new inference_1.InferenceClient(process.env.HF_TOKEN);
// Multiple texts
async function embedText(texts) {
    const vectors = [];
    for (const t of texts) {
        const embedding = await client.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: t,
            provider: "hf-inference"
        });
        var flatEmbedding;
        if (Array.isArray(embedding[0])) {
            flatEmbedding = embedding.flat();
        }
        else {
            flatEmbedding = embedding;
        }
        vectors.push(flatEmbedding.map(Number)); // 384 dims
    }
    return vectors;
}
// Single text
async function embedSingleText(text) {
    const embedding = await client.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
        provider: "hf-inference"
    });
    var flatEmbedding;
    if (Array.isArray(embedding[0])) {
        flatEmbedding = embedding.flat();
    }
    else {
        flatEmbedding = embedding;
    }
    return flatEmbedding.map(Number); // Always 384 dims
}
//# sourceMappingURL=embedding.js.map