import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN!);

// Multiple texts
export async function embedText(texts: string[]) {
  const vectors: number[][] = [];

  for (const t of texts) {
    const embedding = await client.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: t,
      provider: "hf-inference"
    });

    var flatEmbedding: number[];

    if (Array.isArray(embedding[0])) {
      flatEmbedding = (embedding as number[][]).flat();
    } else {
      flatEmbedding = embedding as number[];
    }

    vectors.push(flatEmbedding.map(Number)); // 384 dims
  }

  return vectors;
}

// Single text
export async function embedSingleText(text: string) {
  const embedding = await client.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
    provider: "hf-inference"
  });

  var flatEmbedding: number[];

  if (Array.isArray(embedding[0])) {
    flatEmbedding = (embedding as number[][]).flat();
  } else {
    flatEmbedding = embedding as number[];
  }

  return flatEmbedding.map(Number); // Always 384 dims
}
