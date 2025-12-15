export function chunkText(text: string, chunkSize = 300) {
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
  
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
  