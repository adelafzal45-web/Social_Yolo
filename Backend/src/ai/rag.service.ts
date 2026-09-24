import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RAGChunk, RAGDocument } from '../database/entities';

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    @InjectRepository(RAGDocument)
    private readonly docRepo: Repository<RAGDocument>,
    @InjectRepository(RAGChunk)
    private readonly chunkRepo: Repository<RAGChunk>,
  ) {}

  async indexDocument(
    organizationId: string,
    brandId: string,
    title: string,
    contentText: string,
    sourceType:
      | 'website'
      | 'guidelines'
      | 'product_spec'
      | 'campaign' = 'guidelines',
  ): Promise<RAGDocument> {
    const doc = this.docRepo.create({
      organizationId,
      brandId,
      title,
      contentText,
      sourceType,
    });
    const savedDoc = await this.docRepo.save(doc);

    // Chunk the document into ~150 word segments
    const paragraphs = contentText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let chunkIdx = 0;
    for (const p of paragraphs) {
      // Mock / lightweight embedding vector generation (16-dimensional float vector for cosine test)
      const embedding = this.generateEmbedding(p);
      const chunk = this.chunkRepo.create({
        documentId: savedDoc.id,
        chunkIndex: chunkIdx++,
        content: p,
        embedding,
        tokenCount: Math.ceil(p.length / 4),
      });
      await this.chunkRepo.save(chunk);
    }

    this.logger.log(`Indexed RAG document "${title}" with ${chunkIdx} chunks`);
    return savedDoc;
  }

  async retrieveContext(
    organizationId: string,
    brandId: string,
    query: string,
    topK = 3,
  ): Promise<string[]> {
    const docs = await this.docRepo.find({
      where: { organizationId, brandId },
    });
    if (docs.length === 0) return [];

    const docIds = docs.map((d) => d.id);
    const chunks = await this.chunkRepo
      .createQueryBuilder('chunk')
      .where('chunk.documentId IN (:...docIds)', { docIds })
      .getMany();

    if (chunks.length === 0) return [];

    const queryVec = this.generateEmbedding(query);

    // Calculate Cosine Similarity
    const scored = chunks.map((c) => {
      const score = this.cosineSimilarity(queryVec, c.embedding || []);
      return { chunk: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk.content);
  }

  private generateEmbedding(text: string): number[] {
    // Deterministic 16-dimensional representation based on character hashes
    const vec = new Array(16).fill(0);
    const lower = text.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const code = lower.charCodeAt(i);
      vec[i % 16] += (code % 31) / 31;
    }
    // Normalize vector
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
    return vec.map((v) => parseFloat((v / norm).toFixed(4)));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }
}
