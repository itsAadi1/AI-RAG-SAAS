import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN!);

function normalizeEmbedding(embedding: any): number[] {
  var flatEmbedding: number[];

  if (Array.isArray(embedding[0])) {
    flatEmbedding = (embedding as number[][]).flat();
  } else {
    flatEmbedding = embedding as number[];
  }

  return flatEmbedding.map(Number);
}

// Multiple texts (PARALLEL + BATCHED)
export async function embedText(texts: string[]) {
  const vectors: number[][] = [];
  var batchSize = 10;

  for (var i = 0; i < texts.length; i += batchSize) {
    var batch = texts.slice(i, i + batchSize);

    const embeddings = await client.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: batch,
      provider: "hf-inference"
    });

    for (const emb of embeddings as number[][]) {
      vectors.push(emb.map(Number));
    }
  }

  return vectors;
}


// Single text (unchanged, already fine)
export async function embedSingleText(text: string) {
  const embedding = await client.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
    provider: "hf-inference"
  });

  return normalizeEmbedding(embedding);
}
