import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';

import { StyleReference } from './entities/style-reference.entity';
import {
  CreateStyleReferenceDto,
  ListStyleReferencesDto,
  UpdateStyleReferenceDto,
} from './dto/style-reference.dto';
import {
  UploadedFile,
  readFileBuffer,
} from '../common/upload/image-upload';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';
import { GeminiService, StyleImageAnalysis } from '../post-generator/gemini.service';
import { RetrieverService, normalizeCategory } from '../post-generator/rag/retriever.service';
import { STARTER_STYLE_LIBRARY } from './starter-library';

/** Public-facing shape of a reference — never leaks the raw vector. */
export interface StyleReferenceView {
  id: string;
  title: string | null;
  notes: string | null;
  contentText: string;
  category: string | null;
  tags: string[];
  imageUrl: string | null;
  source: 'global' | 'user';
  isActive: boolean;
  usageCount: number;
  hasEmbedding: boolean;
  analysedByAi: boolean;
  analysis: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Where uploaded reference images are stored.
 *
 * This lives under `public/uploads/` rather than a top-level
 * `public/style-references/` directory on purpose: `main.ts` also serves
 * `public/` under the `/api/` prefix, so a folder named `style-references`
 * would shadow the `/api/style-references` route with a 301 redirect from
 * `serve-static`. Never name an upload folder after an API route.
 */
const UPLOAD_SUBDIR = 'uploads/style-refs';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Style Reference Library.
 *
 * This is the UI-driven replacement for the old `seed-sample-posts.cjs`
 * script. Any signed-in user can upload a reference image; an admin can
 * promote one to the global pool. Every entry is automatically described by
 * Gemini Vision and embedded, so it becomes retrievable on the very next
 * generation — the corpus grows with usage instead of with manual seeding.
 */
@Injectable()
export class StyleReferenceService {
  private readonly logger = new Logger(StyleReferenceService.name);
  private readonly uploadDir = resolve(process.cwd(), 'public', UPLOAD_SUBDIR);

  constructor(
    @InjectRepository(StyleReference)
    private readonly repo: Repository<StyleReference>,
    private readonly embeddingsService: EmbeddingsService,
    private readonly geminiService: GeminiService,
    private readonly retrieverService: RetrieverService,
  ) {}


  /* ------------------------------------------------------------------ */
  /* create                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Ingests one uploaded reference image end-to-end: validate → store on
   * disk → Gemini Vision analysis → text + image embedding → persist.
   *
   * The AI analysis step is what turns a picture into *retrievable knowledge*:
   * the embedder can compare a text brief against the words describing the
   * image, so a user can later say "moody editorial skincare" and get this
   * picture back.
   */
  async createFromUpload(
    dto: CreateStyleReferenceDto,
    file: UploadedFile,
    ownerUserId: string,
    options: { makeGlobal?: boolean } = {},
  ): Promise<StyleReferenceView> {
    const buffer = await readFileBuffer(file);

    await mkdir(this.uploadDir, { recursive: true });
    const ext = (extname(file.originalname || '') || '.png').toLowerCase();
    const fileName = `ref-${randomUUID()}${ext}`;
    await writeFile(resolve(this.uploadDir, fileName), buffer);

    const imagePath = `${UPLOAD_SUBDIR}/${fileName}`;
    const mimeType = MIME_BY_EXTENSION[ext] || 'image/png';

    try {
      const analysis = await this.geminiService.analyzeStyleImage(
        buffer.toString('base64'),
        mimeType,
        { title: dto.title, notes: dto.notes, hint: dto.hint },
      );

      const saved = await this.persist({
        ownerUserId,
        imagePath,
        analysis,
        title: dto.title?.trim() || analysis.title,
        notes: dto.notes?.trim() || null,
        category: dto.category || analysis.category,
        tags: mergeTags(dto.tags, analysis.tags),
        source: options.makeGlobal ? 'global' : 'user',
      });

      this.logger.log(
        `Style reference "${saved.title}" indexed (${saved.embedding?.length ? 'embedded' : 'text-only'}) by user ${ownerUserId}.`,
      );
      return toView(saved);
    } catch (error) {
      // Never leave an orphan file behind if indexing failed.
      await unlink(resolve(this.uploadDir, fileName)).catch(() => {});
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Could not index the reference: ${message}`);
    }
  }

  /** Creates a text-only knowledge entry (no image attached). */
  async createTextEntry(
    ownerUserId: string,
    payload: {
      title: string;
      notes?: string;
      category?: string;
      tags?: string;
      contentText: string;
    },
    options: { makeGlobal?: boolean } = {},
  ): Promise<StyleReferenceView> {
    const analysis: StyleImageAnalysis = {
      title: payload.title,
      category: normalizeCategory(payload.category || ''),
      tags: splitTags(payload.tags),
      visualDescription: '',
      styleSummary: payload.contentText,
      composition: '',
      lighting: '',
      typography: '',
      colorPalette: [],
      mood: '',
      qualityBar: '',
      analysedByAi: false,
    };

    const saved = await this.persist({
      ownerUserId,
      imagePath: null,
      analysis,
      title: payload.title,
      notes: payload.notes?.trim() || null,
      category: payload.category,
      tags: splitTags(payload.tags),
      source: options.makeGlobal ? 'global' : 'user',
    });

    return toView(saved);
  }

  /* ------------------------------------------------------------------ */
  /* read                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Lists the references visible to a user: their own uploads plus the
   * global (platform-curated) pool. Admins can also request every entry.
   */
  async list(
    userId: string | null,
    query: ListStyleReferencesDto = {},
    isAdmin = false,
  ): Promise<StyleReferenceView[]> {
    const includeInactive = isTrue(query.includeInactive);
    const scope = (query.scope || 'all').toLowerCase();

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    if (scope === 'global') {
      where.source = 'global';
    } else if (scope === 'mine') {
      where.ownerUserId = userId ?? undefined;
    }

    if (query.category) {
      where.category = normalizeCategory(query.category);
    }

    /*
     * Default view = "my uploads + the shared global pool".
     *
     * This CANNOT be expressed as `owner_user_id IN (:id, NULL)`: in SQL,
     * `x IN (1, NULL)` is never true — NULL comparisons yield UNKNOWN — so
     * every global row would silently disappear. Passing an ARRAY of `where`
     * clauses makes TypeORM OR them together, which is the correct behaviour.
     */
    const conditions: Record<string, unknown>[] =
      scope === 'all'
        ? isAdmin
          ? // Admins auditing the platform see every entry, private ones too.
            [where]
          : [
              { ...where, ownerUserId: userId ?? undefined },
              { ...where, ownerUserId: IsNull() },
            ]
        : [where];

    const rows = await this.repo.find({
      where: conditions as any,
      order: { createdAt: 'DESC' },
      take: 300,
    });

    const search = (query.search || '').trim().toLowerCase();
    const filtered = search
      ? rows.filter((row) =>
          [row.title, row.notes, row.contentText, (row.tags || []).join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search),
        )
      : rows;

    return filtered.map(toView);
  }

  async getById(
    id: string,
    userId: string | null,
    isAdmin = false,
  ): Promise<StyleReference> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Style reference ${id} not found.`);
    }
    if (!isAdmin && row.source !== 'global' && row.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this style reference.',
      );
    }
    return row;
  }

  /** Distinct categories that currently hold at least one active entry. */
  async listCategories(): Promise<string[]> {
    const rows = await this.repo.find({
      where: { isActive: true },
      select: { category: true },
    });
    return Array.from(
      new Set(rows.map((r) => r.category).filter((c): c is string => Boolean(c))),
    ).sort();
  }


  /* ------------------------------------------------------------------ */
  /* update / delete                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Patches metadata. Any change to the text that gets embedded triggers a
   * re-embed so the vector never drifts from the stored description.
   */
  async update(
    id: string,
    dto: UpdateStyleReferenceDto,
    userId: string | null,
    isAdmin = false,
  ): Promise<StyleReferenceView> {
    const row = await this.getById(id, userId, isAdmin);
    let needsReindex = isTrue(dto.reindex);

    if (dto.title !== undefined) {
      row.title = dto.title.trim() || row.title;
      needsReindex = true;
    }
    if (dto.notes !== undefined) {
      row.notes = dto.notes.trim() || null;
      needsReindex = true;
    }
    if (dto.category !== undefined) {
      row.category = normalizeCategory(dto.category) || null;
      needsReindex = true;
    }
    if (dto.tags !== undefined) {
      row.tags = splitTags(dto.tags);
      needsReindex = true;
    }
    if (dto.isActive !== undefined) {
      row.isActive = isTrue(dto.isActive);
    }

    row.contentText = buildContentText(row.title, row.contentText, row.notes);

    if (needsReindex && this.embeddingsService.isConfigured) {
      row.embedding = await this.embeddingsService.embedText(row.contentText);
    }

    const saved = await this.repo.save(row);
    this.retrieverService.invalidateCache();
    return toView(saved);
  }

  /** Deletes the row and its file from disk. */
  async remove(
    id: string,
    userId: string | null,
    isAdmin = false,
  ): Promise<{ success: boolean }> {
    const row = await this.getById(id, userId, isAdmin);
    if (row.imagePath) {
      await unlink(resolve(process.cwd(), 'public', row.imagePath)).catch(() => {});
    }
    await this.repo.remove(row);
    this.retrieverService.invalidateCache();
    return { success: true };
  }

  /** Promotes / demotes an entry between the global pool and a private one. */
  async setScope(
    id: string,
    makeGlobal: boolean,
    adminUserId: string,
  ): Promise<StyleReferenceView> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Style reference ${id} not found.`);
    }
    if (makeGlobal) {
      row.source = 'global';
      row.ownerUserId = null;
    } else {
      row.source = 'user';
      row.ownerUserId = adminUserId;
    }
    const saved = await this.repo.save(row);
    this.retrieverService.invalidateCache();
    return toView(saved);
  }

  /* ------------------------------------------------------------------ */
  /* maintenance                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Recomputes embeddings for every entry that is missing one (or all of
   * them when `force` is set). Useful after upgrading the embedding model
   * or changing `GEMINI_EMBEDDING_DIMENSIONS`.
   */
  async reindex(force = false): Promise<{ processed: number; failed: number }> {
    // `embedding IS NULL` is a real SQL predicate, but TypeORM's
    // FindOptionsWhere types it as number | FindOperator, so query explicitly.
    const rows = force
      ? await this.repo.find()
      : await this.repo
          .createQueryBuilder('ref')
          .where('ref.embedding IS NULL')
          .getMany();

    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        row.embedding = await this.embeddingsService.embedText(row.contentText);
        await this.repo.save(row);
        processed += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Reindex failed for "${row.title}": ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.retrieverService.invalidateCache();
    return { processed, failed };
  }


  /**
   * Seeds the built-in global knowledge base from `starter-library.ts`.
   *
   * This is the UI replacement for `npm run seed:samples`: an admin clicks
   * "Seed starter library" on the Knowledge page and the curated style
   * playbooks are embedded and made globally retrievable. Idempotent — it
   * skips any entry whose title already exists.
   */
  async seedStarterLibrary(
    adminUserId: string,
    options: { force?: boolean } = {},
  ): Promise<{ created: number; skipped: number; failed: number }> {
    if (options.force) {
      await this.repo.delete({ source: 'global' });
      this.retrieverService.invalidateCache();
    }

    const existingTitles = new Set(
      (await this.repo.find({ select: { title: true } }))
        .map((r) => (r.title || '').toLowerCase())
        .filter(Boolean),
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of STARTER_STYLE_LIBRARY) {
      if (existingTitles.has(entry.title.toLowerCase())) {
        skipped += 1;
        continue;
      }
      try {
        await this.createTextEntry(
          adminUserId,
          {
            title: entry.title,
            category: entry.category,
            tags: entry.tags.join(', '),
            notes: entry.notes,
            contentText: entry.contentText,
          },
          { makeGlobal: true },
        );
        created += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Starter library entry "${entry.title}" failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.retrieverService.invalidateCache();
    return { created, skipped, failed };
  }


  /* ------------------------------------------------------------------ */
  /* internals                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Shared write path: composes the embeddable text, produces the embedding
   * (multimodal when an image is present), and saves the row.
   */
  private async persist(input: {
    ownerUserId: string;
    imagePath: string | null;
    analysis: StyleImageAnalysis;
    title: string;
    notes: string | null;
    category?: string;
    tags: string[];
    source: 'global' | 'user';
  }): Promise<StyleReference> {
    const { analysis } = input;
    const category = normalizeCategory(input.category || analysis.category) || null;

    const contentText = buildContentText(
      input.title,
      analysis.styleSummary,
      input.notes,
      [
        analysis.visualDescription,
        analysis.composition ? `Composition: ${analysis.composition}` : '',
        analysis.lighting ? `Lighting: ${analysis.lighting}` : '',
        analysis.typography ? `Typography: ${analysis.typography}` : '',
        analysis.colorPalette.length
          ? `Palette: ${analysis.colorPalette.join(', ')}`
          : '',
        analysis.mood ? `Mood: ${analysis.mood}` : '',
        analysis.qualityBar ? `Quality bar: ${analysis.qualityBar}` : '',
        category ? `Category: ${category}` : '',
      ].filter(Boolean),
    );

    let embedding: number[] | null = null;
    if (this.embeddingsService.isConfigured) {
      if (input.imagePath) {
        // Prefer a multimodal vector: it matches image *and* text queries.
        const buffer = await readFile(
          resolve(process.cwd(), 'public', input.imagePath),
        ).catch(() => null);
        if (buffer) {
          embedding = await this.embeddingsService.embedImage(
            buffer.toString('base64'),
            { mimeType: guessMime(input.imagePath), text: contentText.slice(0, 900) },
          );
        }
      }
      if (!embedding) {
        embedding = await this.embeddingsService.embedText(contentText);
      }
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not set — style reference saved without an embedding and will not be retrievable until you reindex.',
      );
    }

    const row = this.repo.create({
      ownerUserId: input.source === 'global' ? null : input.ownerUserId,
      title: input.title,
      notes: input.notes,
      contentText,
      category,
      tags: input.tags,
      imagePath: input.imagePath,
      source: input.source,
      isActive: true,
      usageCount: 0,
      embedding,
      analysis: {
        analysedByAi: analysis.analysedByAi,
        visualDescription: analysis.visualDescription,
        composition: analysis.composition,
        lighting: analysis.lighting,
        typography: analysis.typography,
        colorPalette: analysis.colorPalette,
        mood: analysis.mood,
        qualityBar: analysis.qualityBar,
      },
    });

    const saved = await this.repo.save(row);
    this.retrieverService.invalidateCache();
    return saved;
  }
}


/* -------------------------------------------------------------------- */
/* module-level helpers                                                  */
/* -------------------------------------------------------------------- */

function toView(row: StyleReference): StyleReferenceView {
  const analysis = (row.analysis || {}) as Record<string, unknown>;
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    contentText: row.contentText,
    category: row.category,
    tags: row.tags || [],
    imageUrl: row.imagePath ? `/${row.imagePath}` : null,
    source: row.source,
    isActive: row.isActive,
    usageCount: row.usageCount,
    hasEmbedding: Boolean(row.embedding && row.embedding.length > 0),
    analysedByAi: Boolean(analysis.analysedByAi),
    analysis: row.analysis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Parses a comma-separated tag string into a clean lowercase array. */
function splitTags(tags?: string | null): string[] {
  return (tags || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

/** Merges user-supplied tags with the AI-detected ones, keeping both. */
function mergeTags(userTags?: string | null, aiTags: string[] = []): string[] {
  return Array.from(new Set([...splitTags(userTags), ...aiTags])).slice(0, 12);
}

function isTrue(value?: string | null): boolean {
  return value === 'true' || value === '1' || value === 'yes';
}

function guessMime(imagePath: string): string {
  const ext = (imagePath.split('.').pop() || '').toLowerCase();
  return MIME_BY_EXTENSION[`.${ext}`] || 'image/png';
}

/**
 * Composes the exact text that gets embedded and later quoted back to the
 * planner model. The uploader's note goes last so a human instruction
 * ("use this for lighting only") is the most recent, most salient thing the
 * model reads.
 */
function buildContentText(
  title: string | null,
  styleSummary: string,
  notes?: string | null,
  extraSections: string[] = [],
): string {
  return [
    `Reference: ${title || 'Untitled style reference'}.`,
    styleSummary,
    ...extraSections,
    notes ? `Uploader note: ${notes}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

